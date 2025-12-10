import { useParams } from 'react-router-dom';
import { useLiveKit } from '../hooks/useLiveKit';
import { VoiceControls } from '../components/VoiceControls';
import { TranscriptDisplay } from '../components/TranscriptDisplay';
import { useUserStore } from '@/stores/userStore';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
};

export default function ChatPage() {
  const { conversationId } = useParams();
  const { preferences } = useUserStore();

  const {
    isConnected,
    isConnecting,
    isSpeaking,
    agentIsSpeaking,
    isMicEnabled,
    transcripts,
    error,
    connect,
    disconnect,
    toggleMicrophone,
  } = useLiveKit({
    conversationId,
    targetLanguage: preferences.targetLanguage,
    nativeLanguage: preferences.nativeLanguage,
    level: preferences.level,
    speakingSpeed: preferences.speakingSpeed,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">
          {conversationId ? 'Continue Conversation' : 'New Conversation'}
        </h1>
        {isConnected && (
          <span className="flex items-center gap-2 text-sm text-green-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Connected
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-4 sm:p-8">
        {!isConnected ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 sm:h-20 sm:w-20">
              <svg
                className="h-8 w-8 text-primary sm:h-10 sm:w-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-lg font-semibold sm:text-xl">Ready to practice?</h2>
            <p className="mb-6 text-sm text-muted-foreground sm:text-base">
              Click the button below to start a voice conversation with your AI tutor.
            </p>
            <VoiceControls
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMicEnabled={isMicEnabled}
              isSpeaking={isSpeaking}
              agentIsSpeaking={agentIsSpeaking}
              onConnect={connect}
              onDisconnect={disconnect}
              onToggleMic={toggleMicrophone}
            />
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-4 sm:gap-6">
            {/* AI Avatar / Speaking indicator */}
            <div className="relative">
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full transition-all sm:h-32 sm:w-32 ${
                  agentIsSpeaking ? 'bg-primary/20 ring-4 ring-primary/50' : 'bg-muted'
                }`}
              >
                <svg
                  className={`h-12 w-12 transition-colors sm:h-16 sm:w-16 ${
                    agentIsSpeaking ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              {agentIsSpeaking && (
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              )}
            </div>

            <p className="px-4 text-center text-sm text-muted-foreground sm:text-base">
              {agentIsSpeaking
                ? 'AI tutor is speaking...'
                : isSpeaking
                  ? 'Listening to you...'
                  : `Speak in ${LANGUAGE_NAMES[preferences.targetLanguage] || preferences.targetLanguage} to practice.`}
            </p>

            {/* Voice Controls */}
            <VoiceControls
              isConnected={isConnected}
              isConnecting={isConnecting}
              isMicEnabled={isMicEnabled}
              isSpeaking={isSpeaking}
              agentIsSpeaking={agentIsSpeaking}
              onConnect={connect}
              onDisconnect={disconnect}
              onToggleMic={toggleMicrophone}
            />
          </div>
        )}
      </div>

      {/* Transcript area */}
      <div className="mt-4">
        <TranscriptDisplay transcripts={transcripts} isConnected={isConnected} />
      </div>
    </div>
  );
}
