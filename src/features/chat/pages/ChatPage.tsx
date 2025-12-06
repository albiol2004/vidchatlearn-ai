import { useParams } from 'react-router-dom';

export default function ChatPage() {
  const { conversationId } = useParams();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {conversationId ? 'Continue Conversation' : 'New Conversation'}
        </h1>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-10 w-10 text-primary"
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
          <h2 className="mb-2 text-xl font-semibold">Ready to practice?</h2>
          <p className="mb-6 text-muted-foreground">
            Click the button below to start a voice conversation with your AI tutor.
          </p>
          <button className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground hover:bg-primary/90">
            Start Conversation
          </button>
        </div>
      </div>

      {/* Transcript area - will show live transcript during conversation */}
      <div className="mt-4 rounded-lg border bg-muted/30 p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Live Transcript</h3>
        <p className="text-sm text-muted-foreground italic">
          Transcript will appear here during the conversation...
        </p>
      </div>
    </div>
  );
}
