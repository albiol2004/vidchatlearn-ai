import { useParams, Link } from 'react-router-dom';

export default function ConversationDetailPage() {
  const { id } = useParams();

  // TODO: Fetch conversation details from Supabase

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversation Details</h1>
          <p className="text-muted-foreground">ID: {id}</p>
        </div>
        <Link
          to={`/chat/${id}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue Conversation
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transcript */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Transcript</h2>
            <div className="space-y-4">
              <p className="text-sm italic text-muted-foreground">
                Transcript will be loaded here...
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div>
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Learning Tips</h2>
            <div className="space-y-4">
              <p className="text-sm italic text-muted-foreground">Tips will be displayed here...</p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Stats</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span>--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Words spoken</span>
                <span>--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Corrections</span>
                <span>--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
