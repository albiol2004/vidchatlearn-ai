import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { MessageSquare, History, CreditCard, Settings } from 'lucide-react';

const navItems = [
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/conversations', label: 'History', icon: History },
  { to: '/billing', label: 'Billing', icon: CreditCard },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold text-primary">VCL</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
  );
}
