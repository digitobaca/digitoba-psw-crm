import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, UserCircle2, FileText, ClipboardList, CreditCard, MessageSquare } from 'lucide-react';
import { LogOut, Menu } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/portal', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/portal/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/portal/documents', label: 'Documents', icon: FileText },
  { to: '/portal/applications', label: 'Applications', icon: ClipboardList },
  { to: '/portal/payments', label: 'Payments', icon: CreditCard },
  { to: '/portal/messages', label: 'Messages', icon: MessageSquare },
];

/**
 * Same left sidebar panel shell as the staff CRM's AdminLayout — kept
 * visually consistent on purpose (brand tile, vertical nav with icons,
 * footer with identity + logout, off-canvas drawer on mobile) even though
 * this is a completely separate auth track/component tree.
 */
export default function PortalLayout() {
  const { student, signOut } = usePortalAuth();
  const [logoutHover, setLogoutHover] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/30 sm:flex">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 sm:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white transition-transform duration-200 ease-in-out',
          'sm:sticky sm:top-0 sm:h-screen sm:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />

        <div className="flex items-center gap-2.5 border-b px-5 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
            CD
          </span>
          <div className="leading-tight">
            <p className="font-bold text-sm text-gray-900">CanadaDigitoba</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
                  isActive && 'bg-primary/10 text-primary font-semibold'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} className={cn('shrink-0', isActive && 'text-primary')} />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t px-4 py-4">
          <span className="block truncate text-sm text-muted-foreground">{student?.name}</span>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            onClick={signOut}
          >
            <LogOut size={16} animate={logoutHover} /> Log Out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col sm:min-w-0">
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-white px-4 sm:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation">
            <Menu size={20} animate={mobileOpen} />
          </Button>
          <span className="font-bold text-sm text-gray-900">Student Portal</span>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
