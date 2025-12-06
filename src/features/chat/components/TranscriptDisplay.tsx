import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../hooks/useLiveKit';

interface TranscriptDisplayProps {
  transcripts: TranscriptEntry[];
  isConnected: boolean;
}

export function TranscriptDisplay({ transcripts, isConnected }: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (!isConnected && transcripts.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Live Transcript</h3>
        <p className="text-sm italic text-muted-foreground">
          Transcript will appear here during the conversation...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30">
      <div className="border-b px-4 py-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Live Transcript
          {isConnected && (
            <span className="ml-2 inline-flex items-center">
              <span className="mr-1 h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs text-green-600">Live</span>
            </span>
          )}
        </h3>
      </div>
      <div ref={scrollRef} className="max-h-64 overflow-y-auto p-4">
        {transcripts.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            Start speaking to see the transcript...
          </p>
        ) : (
          <div className="space-y-3">
            {transcripts.map((entry) => (
              <TranscriptMessage key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TranscriptMessage({ entry }: { entry: TranscriptEntry }) {
  const isUser = entry.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
        } ${!entry.isFinal ? 'opacity-70' : ''}`}
      >
        <p className="text-sm">{entry.text}</p>
        <p
          className={`mt-1 text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
        >
          {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {!entry.isFinal && ' (transcribing...)'}
        </p>
      </div>
    </div>
  );
}
