import { useAuth } from '../hooks/useAuth';

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="mt-1 font-mono text-sm">{user?.id}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">Data & Privacy</h2>
          <div className="space-y-4">
            <button className="rounded-md bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80">
              Export my data
            </button>
            <button className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
              Delete my account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
