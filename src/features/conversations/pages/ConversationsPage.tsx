import { Link } from 'react-router-dom';

export default function ConversationsPage() {
  // TODO: Fetch conversations from Supabase
  const conversations: Array<{
    id: string;
    title: string;
    language: string;
    duration: number;
    date: string;
  }> = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversation History</h1>
        <p className="text-muted-foreground">Review your past conversations and tips</p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
          <p className="mb-4 text-muted-foreground">No conversations yet</p>
          <Link
            to="/chat"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start your first conversation
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/conversations/${conversation.id}`}
              className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <h3 className="font-medium">{conversation.title}</h3>
              <p className="text-sm text-muted-foreground">{conversation.language}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{conversation.duration} min</span>
                <span>{conversation.date}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
