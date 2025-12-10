interface VoiceControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicEnabled: boolean;
  isSpeaking: boolean;
  agentIsSpeaking: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMic: () => void;
}

export function VoiceControls({
  isConnected,
  isConnecting,
  isMicEnabled,
  isSpeaking,
  agentIsSpeaking,
  onConnect,
  onDisconnect,
  onToggleMic,
}: VoiceControlsProps) {
  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        disabled={isConnecting}
        className="flex items-center gap-3 rounded-lg bg-primary px-8 py-4 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {isConnecting ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Connecting...
          </>
        ) : (
          <>
            <MicIcon className="h-5 w-5" />
            Start Conversation
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-4">
        {/* Microphone toggle */}
        <button
          onClick={onToggleMic}
          className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all sm:h-16 sm:w-16 ${
            isMicEnabled
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          }`}
        >
          {isMicEnabled ? (
            <MicIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          ) : (
            <MicOffIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          )}
          {/* Speaking indicator */}
          {isSpeaking && isMicEnabled && (
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/50" />
          )}
        </button>

        {/* Status indicator */}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isSpeaking
              ? 'You are speaking...'
              : agentIsSpeaking
                ? 'AI is responding...'
                : 'Listening...'}
          </span>
          <span className="text-xs text-muted-foreground">
            {isMicEnabled ? 'Microphone on' : 'Microphone muted'}
          </span>
        </div>
      </div>

      {/* End conversation button */}
      <button
        onClick={onDisconnect}
        className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/20 sm:ml-auto"
      >
        <PhoneOffIcon className="h-4 w-4" />
        End
      </button>
    </div>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
      />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
      />
    </svg>
  );
}

function PhoneOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
      />
    </svg>
  );
}
