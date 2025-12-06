import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">VidChatLearn AI</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Link
              to="/account"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Account
            </Link>
            <button
              onClick={() => signOut()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
