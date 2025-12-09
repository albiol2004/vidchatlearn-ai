import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { MessageSquare, History, CreditCard, Settings, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const navItems = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/conversations', label: 'History', icon: History },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 md:static md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <span className="text-lg font-bold text-primary">VCL</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
