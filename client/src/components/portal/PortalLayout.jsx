import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/portal', label: 'Dashboard', end: true },
  { to: '/portal/profile', label: 'Profile' },
  { to: '/portal/documents', label: 'Documents' },
  { to: '/portal/applications', label: 'Applications' },
  { to: '/portal/payments', label: 'Payments' },
  { to: '/portal/messages', label: 'Messages' },
];

export default function PortalLayout() {
  const { student, signOut } = usePortalAuth();
  const [logoutHover, setLogoutHover] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm">
              CD
            </span>
            Student Portal
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{student?.name}</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              onClick={signOut}
            >
              <LogOut size={16} animate={logoutHover} /> Log Out
            </Button>
          </div>
        </div>
        <nav className="flex overflow-x-auto gap-1 px-4 pb-2 sm:container sm:px-0">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50',
                  isActive && 'bg-accent text-accent-foreground'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>
    </div>
  );
}
