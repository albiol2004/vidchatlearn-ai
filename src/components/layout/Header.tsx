import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';

export function Header() {
  const { user, signOut } = useAuth();
  const { toggleSidebar } = useUIStore();

  return (
    <header className="flex h-16 items-center justify-between border-b px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold md:text-xl">VidChatLearn AI</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {user && (
          <>
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
            <Link to="/account" className="text-sm text-muted-foreground hover:text-foreground">
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
