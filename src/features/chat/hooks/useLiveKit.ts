import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  LocalParticipant,
  ConnectionState,
} from 'livekit-client';
import type { RemoteTrack, RemoteTrackPublication, DataPacket_Kind } from 'livekit-client';
import { supabase } from '@/lib/supabase/client';
import {
  createConversation,
  getConversationWithTranscripts,
  addTranscriptEntry,
  endConversation,
  updateConversationTitle,
  formatTranscriptsForContext,
} from '@/lib/supabase/conversations';

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

interface UseLiveKitOptions {
  conversationId?: string;
  targetLanguage?: string;
  nativeLanguage?: string;
  level?: string;
  speakingSpeed?: number;
}

interface UseLiveKitReturn {
  room: Room | null;
  connectionState: ConnectionState;
  isConnecting: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  agentIsSpeaking: boolean;
  transcripts: TranscriptEntry[];
  error: string | null;
  currentConversationId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMicrophone: () => void;
  isMicEnabled: boolean;
}

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'ws://69.62.122.245:7880';

export function useLiveKit(options: UseLiveKitOptions = {}): UseLiveKitReturn {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.Disconnected
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentIsSpeaking, setAgentIsSpeaking] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const roomRef = useRef<Room | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const agentSpeakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const transcriptCountRef = useRef(0);

  // Debounce delay for agent speaking state (ms) - gives time for natural pauses
  const AGENT_SPEAKING_DEBOUNCE = 1500;

  // Fetch LiveKit token from Supabase Edge Function
  const fetchToken = useCallback(
    async (previousContext?: string): Promise<{ token: string; roomName: string }> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Pass user preferences and conversation context as metadata
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomName: `learn-${session.user.id}-${Date.now()}`,
            metadata: {
              target_language: options.targetLanguage || 'en',
              native_language: options.nativeLanguage || 'es',
              level: options.level || 'beginner',
              speaking_speed: options.speakingSpeed || 1.0,
              conversation_id: conversationIdRef.current,
              previous_context: previousContext || '',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get LiveKit token');
      }

      return response.json();
    },
    [options.targetLanguage, options.nativeLanguage, options.level, options.speakingSpeed]
  );

  // Handle incoming audio tracks from the agent
  const handleTrackSubscribed = useCallback(
    (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio) {
        // Create audio element to play agent's voice
        if (!audioElementRef.current) {
          audioElementRef.current = document.createElement('audio');
          audioElementRef.current.autoplay = true;
          document.body.appendChild(audioElementRef.current);
        }
        track.attach(audioElementRef.current);
      }
    },
    []
  );

  // Handle track unsubscribed
  const handleTrackUnsubscribed = useCallback(
    (track: RemoteTrack, _publication: RemoteTrackPublication, _participant: RemoteParticipant) => {
      if (track.kind === Track.Kind.Audio && audioElementRef.current) {
        track.detach(audioElementRef.current);
      }
    },
    []
  );

  // Save transcript to database
  const saveTranscript = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!conversationIdRef.current || !content.trim()) return;

    await addTranscriptEntry(conversationIdRef.current, role, content);

    // Auto-generate title from first user message
    transcriptCountRef.current += 1;
    if (transcriptCountRef.current === 1 && role === 'user' && conversationIdRef.current) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await updateConversationTitle(conversationIdRef.current, title);
    }
  }, []);

  // Handle data messages (transcripts)
  const handleDataReceived = useCallback(
    (payload: Uint8Array, _participant?: RemoteParticipant, _kind?: DataPacket_Kind) => {
      try {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === 'transcript') {
          const entry: TranscriptEntry = {
            id: data.id || crypto.randomUUID(),
            role: data.role,
            text: data.text,
            timestamp: new Date(),
            isFinal: data.isFinal ?? true,
          };

          setTranscripts((prev) => {
            // Update existing entry or add new one
            const existingIndex = prev.findIndex((t) => t.id === entry.id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = entry;
              return updated;
            }
            return [...prev, entry];
          });

          // Save final transcripts to database
          if (entry.isFinal) {
            saveTranscript(entry.role, entry.text);
          }
        }
      } catch (e) {
        console.error('Error parsing data message:', e);
      }
    },
    [saveTranscript]
  );

  // Connect to LiveKit room
  const connect = useCallback(async () => {
    if (roomRef.current?.state === ConnectionState.Connected) {
      return;
    }

    // Check if mediaDevices API is available (requires HTTPS or localhost)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Microphone access is not available. Please ensure you are using HTTPS or localhost.'
      );
      return;
    }

    setIsConnecting(true);
    setError(null);
    setTranscripts([]);
    transcriptCountRef.current = 0;

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      let previousContext = '';

      // Handle conversation: resume existing or create new
      if (options.conversationId) {
        // Resuming existing conversation - load previous transcripts
        const existingConversation = await getConversationWithTranscripts(options.conversationId);
        if (existingConversation) {
          conversationIdRef.current = existingConversation.id;
          setCurrentConversationId(existingConversation.id);

          // Format previous transcripts as context for the agent
          if (existingConversation.transcript_entries.length > 0) {
            previousContext = formatTranscriptsForContext(existingConversation.transcript_entries);

            // Also populate the UI with previous transcripts
            const previousEntries: TranscriptEntry[] = existingConversation.transcript_entries.map(
              (t) => ({
                id: t.id,
                role: t.role,
                text: t.content,
                timestamp: new Date(t.created_at),
                isFinal: true,
              })
            );
            setTranscripts(previousEntries);
            transcriptCountRef.current = previousEntries.length;
          }
        } else {
          console.warn('Conversation not found, creating new one');
        }
      }

      // Create new conversation if we don't have one
      if (!conversationIdRef.current) {
        const newConversation = await createConversation(
          user.id,
          options.targetLanguage || 'en',
          options.level || 'beginner'
        );
        if (newConversation) {
          conversationIdRef.current = newConversation.id;
          setCurrentConversationId(newConversation.id);
        }
      }

      startTimeRef.current = new Date();

      const { token } = await fetchToken(previousContext);

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Set up event handlers
      newRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      });

      newRoom.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      newRoom.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      newRoom.on(RoomEvent.DataReceived, handleDataReceived);

      newRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const localSpeaking = speakers.some((s) => s instanceof LocalParticipant);
        const remoteSpeaking = speakers.some((s) => s instanceof RemoteParticipant);
        setIsSpeaking(localSpeaking);

        // Debounce agent speaking state to handle natural pauses
        if (remoteSpeaking) {
          // Agent started speaking - clear any pending timeout and set immediately
          if (agentSpeakingTimeoutRef.current) {
            clearTimeout(agentSpeakingTimeoutRef.current);
            agentSpeakingTimeoutRef.current = null;
          }
          setAgentIsSpeaking(true);
        } else {
          // Agent stopped speaking - wait before updating state in case they resume
          if (!agentSpeakingTimeoutRef.current) {
            agentSpeakingTimeoutRef.current = setTimeout(() => {
              setAgentIsSpeaking(false);
              agentSpeakingTimeoutRef.current = null;
            }, AGENT_SPEAKING_DEBOUNCE);
          }
        }
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setConnectionState(ConnectionState.Disconnected);
      });

      // Connect to the room
      await newRoom.connect(LIVEKIT_URL, token);

      // Enable microphone
      await newRoom.localParticipant.setMicrophoneEnabled(true);
      setIsMicEnabled(true);

      roomRef.current = newRoom;
      setRoom(newRoom);
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  }, [
    fetchToken,
    handleTrackSubscribed,
    handleTrackUnsubscribed,
    handleDataReceived,
    options.conversationId,
    options.targetLanguage,
    options.level,
  ]);

  // Disconnect from room
  const disconnect = useCallback(async () => {
    // Clear any pending speaking timeout
    if (agentSpeakingTimeoutRef.current) {
      clearTimeout(agentSpeakingTimeoutRef.current);
      agentSpeakingTimeoutRef.current = null;
    }

    // End conversation in database
    if (conversationIdRef.current && startTimeRef.current) {
      const durationSeconds = Math.round(
        (new Date().getTime() - startTimeRef.current.getTime()) / 1000
      );
      await endConversation(conversationIdRef.current, durationSeconds);
    }

    if (roomRef.current) {
      // Remove all event listeners before disconnecting
      roomRef.current.removeAllListeners();
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
    }

    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.srcObject = null;
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }

    // Reset refs
    conversationIdRef.current = null;
    startTimeRef.current = null;
    transcriptCountRef.current = 0;

    // Reset all states
    setTranscripts([]);
    setCurrentConversationId(null);
    setIsSpeaking(false);
    setAgentIsSpeaking(false);
    setIsMicEnabled(true);
    setError(null);
    setIsConnecting(false);
    setConnectionState(ConnectionState.Disconnected);
  }, []);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (roomRef.current?.localParticipant) {
      const newState = !isMicEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
      setIsMicEnabled(newState);
    }
  }, [isMicEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    room,
    connectionState,
    isConnecting,
    isConnected: connectionState === ConnectionState.Connected,
    isSpeaking,
    agentIsSpeaking,
    transcripts,
    error,
    currentConversationId,
    connect,
    disconnect,
    toggleMicrophone,
    isMicEnabled,
  };
}
