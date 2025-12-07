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

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

interface UseLiveKitOptions {
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

  const roomRef = useRef<Room | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Fetch LiveKit token from Supabase Edge Function
  const fetchToken = useCallback(async (): Promise<{ token: string; roomName: string }> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Pass user preferences as room metadata
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
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get LiveKit token');
    }

    return response.json();
  }, [options.targetLanguage, options.nativeLanguage, options.level, options.speakingSpeed]);

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
        }
      } catch (e) {
        console.error('Error parsing data message:', e);
      }
    },
    []
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

    try {
      const { token } = await fetchToken();

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
        setAgentIsSpeaking(remoteSpeaking);
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
  }, [fetchToken, handleTrackSubscribed, handleTrackUnsubscribed, handleDataReceived]);

  // Disconnect from room
  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
      setRoom(null);
    }

    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.remove();
      audioElementRef.current = null;
    }

    setTranscripts([]);
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
    connect,
    disconnect,
    toggleMicrophone,
    isMicEnabled,
  };
}
