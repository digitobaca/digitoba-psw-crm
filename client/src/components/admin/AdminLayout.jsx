import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, ClipboardList, MessageSquare, GraduationCap, Clock3, UserCog, Megaphone, BarChart3 } from 'lucide-react';
import { LogOut, Menu } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import ShiftEndDialog from '@/components/admin/ShiftEndDialog.jsx';
import CanadaClock from '@/components/admin/CanadaClock.jsx';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatTime } from '@/lib/utils';
import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

const NAV = [
  { to: '/admin', label: 'Students', end: true, roles: ['admin', 'counsellor'], badge2: 'newLeads', icon: Users },
  { to: '/admin/applications', label: 'Applications', roles: ['admin', 'counsellor'], icon: ClipboardList },
  { to: '/admin/messages', label: 'Messages', roles: ['admin', 'counsellor'], badge: 'unread', icon: MessageSquare },
  { to: '/admin/colleges', label: 'Colleges', roles: ['admin', 'counsellor'], icon: GraduationCap },
  { to: '/admin/attendance', label: 'Attendance', roles: ['admin', 'counsellor'], icon: Clock3 },
  { to: '/admin/counsellors', label: 'Counsellors', roles: ['admin'], icon: UserCog },
  { to: '/admin/ads', label: 'Ads Dashboard', roles: ['admin'], icon: Megaphone },
  { to: '/admin/analytics', label: 'Analytics', roles: ['admin'], icon: BarChart3 },
];

const UNREAD_POLL_MS = 15000;
const NEW_LEADS_POLL_MS = 20000;

/**
 * Admin and counsellor share every screen in this CRM, which got genuinely
 * confusing once Messages made the difference between the two roles
 * functional (admin monitors, counsellor replies) rather than just a nav
 * item being hidden. This gives the sidebar a persistent, impossible-to-miss
 * "which mode am I in" signal: a colored accent stripe down the left edge, a
 * matching logo tile, a labeled subtitle, and a role-tinted active nav state
 * — not just a small badge that's easy to scroll past.
 */
const ROLE_META = {
  admin: {
    label: 'Admin Console',
    barClass: 'bg-indigo-600',
    tileClass: 'bg-indigo-600',
    subtitleClass: 'text-indigo-600',
    activeClass: 'bg-indigo-50 text-indigo-700',
    iconActiveClass: 'text-indigo-600',
  },
  counsellor: {
    label: 'Counsellor Workspace',
    barClass: 'bg-primary',
    tileClass: 'bg-primary',
    subtitleClass: 'text-muted-foreground',
    activeClass: 'bg-primary/10 text-primary',
    iconActiveClass: 'text-primary',
  },
};

/**
 * Small pill next to a nav label — only rendered when there's something to
 * show. Red for "someone's waiting on a reply" (Messages), amber for "fresh
 * unactioned leads" — same shape, different color, so the two kinds of
 * "something needs you" don't blur together.
 */
function NavBadge({ count, color = 'bg-red-500' }) {
  if (!count) return null;
  return (
    <span className={cn('ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-semibold', color)}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Shared shell for every /admin/* screen: a left sidebar panel + role-aware nav + shift tracking. */
export default function AdminLayout() {
  const { user, shift, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoutHover, setLogoutHover] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const visibleNav = NAV.filter((item) => item.roles.includes(user?.role));
  const roleMeta = ROLE_META[user?.role] || ROLE_META.counsellor;

  useEffect(() => {
    const poll = () => api.fetchUnreadCount().then((res) => setUnreadCount(res.count)).catch(() => {});
    poll();
    const interval = setInterval(poll, UNREAD_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Both roles — a counsellor should hear about their own fresh leads, an
  // admin about the team's. The list itself is already scoped server-side
  // (scopeToCounsellor), so the same query naturally means "mine" for a
  // counsellor and "everyone's" for an admin.
  useEffect(() => {
    const poll = () => api.fetchNewLeadsCount().then(setNewLeadsCount).catch(() => {});
    poll();
    const interval = setInterval(poll, NEW_LEADS_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleShiftEnd = async (summary) => {
    await signOut(summary);
    setShiftDialogOpen(false);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-secondary/30 sm:flex">
      {/* Mobile backdrop — click to close the slide-in panel */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 sm:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      {/* Sidebar — persistent panel on desktop, off-canvas slide-in on mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-white transition-transform duration-200 ease-in-out',
          'sm:sticky sm:top-0 sm:h-screen sm:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className={cn('absolute inset-y-0 left-0 w-1', roleMeta.barClass)} aria-hidden="true" />

        <div className="flex items-center gap-2.5 border-b px-5 py-5">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white text-sm font-bold', roleMeta.tileClass)}>
            CD
          </span>
          <div className="leading-tight">
            <p className="font-bold text-sm text-gray-900">CanadaDigitoba CRM</p>
            <p className={cn('text-[11px] font-semibold', roleMeta.subtitleClass)}>{roleMeta.label}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900',
                  isActive && cn('font-semibold', roleMeta.activeClass)
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={17} className={cn('shrink-0', isActive && roleMeta.iconActiveClass)} />
                  <span className="truncate">{item.label}</span>
                  {item.badge === 'unread' && <NavBadge count={unreadCount} />}
                  {item.badge2 === 'newLeads' && <NavBadge count={newLeadsCount} color="bg-amber-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t px-4 py-4">
          <CanadaClock />
          {shift?.shiftStart && (
            <Badge variant="success" className="w-full justify-center whitespace-nowrap">
              Shift started {formatTime(shift.shiftStart)}
            </Badge>
          )}
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                'shrink-0 capitalize border-transparent',
                user?.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-primary/10 text-primary'
              )}
            >
              {user?.role}
            </Badge>
            <span className="truncate text-sm text-muted-foreground">{user?.name}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            onClick={() => setShiftDialogOpen(true)}
          >
            <LogOut size={16} animate={logoutHover} /> Log Out
          </Button>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-h-screen flex-1 flex-col sm:min-w-0">
        {/* Slim mobile top bar — just enough to open the panel; everything else lives in the sidebar itself */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-white px-4 sm:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle navigation">
            <Menu size={20} animate={mobileOpen} />
          </Button>
          <span className="font-bold text-sm text-gray-900">CanadaDigitoba CRM</span>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>

      <ShiftEndDialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen} shift={shift} onConfirm={handleShiftEnd} />
    </div>
  );
}
