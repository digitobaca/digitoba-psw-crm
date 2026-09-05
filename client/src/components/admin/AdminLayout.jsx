import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import ShiftEndDialog from '@/components/admin/ShiftEndDialog.jsx';
import CanadaClock from '@/components/admin/CanadaClock.jsx';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatTime } from '@/lib/utils';
import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

const NAV = [
  { to: '/admin', label: 'Students', end: true, roles: ['admin', 'counsellor'], badge2: 'newLeads' },
  { to: '/admin/applications', label: 'Applications', roles: ['admin', 'counsellor'] },
  { to: '/admin/messages', label: 'Messages', roles: ['admin', 'counsellor'], badge: 'unread' },
  { to: '/admin/colleges', label: 'Colleges', roles: ['admin', 'counsellor'] },
  { to: '/admin/attendance', label: 'Attendance', roles: ['admin', 'counsellor'] },
  { to: '/admin/counsellors', label: 'Counsellors', roles: ['admin'] },
  { to: '/admin/ads', label: 'Ads Dashboard', roles: ['admin'] },
  { to: '/admin/analytics', label: 'Analytics', roles: ['admin'] },
  // Fee Ledger module (client/src/features/fees/) is deliberately NOT listed
  // here — admin-only, and not linked from the main dashboard nav at all.
  // It's still a real route (/fees, see App.jsx, itself gated to admin) —
  // just not something anyone stumbles into by browsing the sidebar.
];

const UNREAD_POLL_MS = 15000;
const NEW_LEADS_POLL_MS = 20000;

/**
 * Admin and counsellor share every screen in this CRM, which got genuinely
 * confusing once Messages made the difference between the two roles
 * functional (admin monitors, counsellor replies) rather than just a nav
 * item being hidden. This gives every /admin/* screen a persistent,
 * impossible-to-miss "which mode am I in" signal: a colored top strip, a
 * matching logo tile, and a labeled subtitle — not just a small badge that's
 * easy to scroll past.
 */
const ROLE_META = {
  admin: { label: 'Admin Console', barClass: 'bg-indigo-600', tileClass: 'bg-indigo-600', subtitleClass: 'text-indigo-600' },
  counsellor: { label: 'Counsellor Workspace', barClass: 'bg-primary', tileClass: 'bg-primary', subtitleClass: 'text-muted-foreground' },
  // Fee Ledger module roles (server/models/User.js ROLES) — registrar is
  // college finance/admissions staff, partner is a recruitment agency login.
  registrar: { label: 'Registrar (Fees)', barClass: 'bg-emerald-700', tileClass: 'bg-emerald-700', subtitleClass: 'text-emerald-700' },
  partner: { label: 'Partner Portal', barClass: 'bg-amber-600', tileClass: 'bg-amber-600', subtitleClass: 'text-amber-700' },
};

/**
 * Small pill next to a nav label — only rendered when there's something to
 * show. Red for "someone's waiting on a reply" (Messages), indigo for
 * "waiting on an admin decision" (pending review) — same shape, different
 * color, so the two kinds of "something needs you" don't blur together.
 */
function NavBadge({ count, color = 'bg-red-500' }) {
  if (!count) return null;
  return (
    <span className={cn('ml-1.5 inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-white text-[10px] font-semibold align-middle', color)}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Shared shell for every /admin/* screen: top bar + role-aware nav + shift tracking. */
export default function AdminLayout() {
  const { user, shift, signOut } = useAuth();
  const navigate = useNavigate();
  const [logoutHover, setLogoutHover] = useState(false);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
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
    <div className="min-h-screen bg-secondary/30">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className={cn('h-1', roleMeta.barClass)} aria-hidden="true" />
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white text-sm font-bold', roleMeta.tileClass)}>
                CD
              </span>
              <div className="leading-tight">
                <p className="font-bold text-sm text-gray-900">CanadaDigitoba CRM</p>
                <p className={cn('text-[11px] font-semibold', roleMeta.subtitleClass)}>{roleMeta.label}</p>
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-1">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      isActive && 'bg-accent text-accent-foreground'
                    )
                  }
                >
                  {item.label}
                  {item.badge === 'unread' && <NavBadge count={unreadCount} />}
                  {item.badge2 === 'newLeads' && <NavBadge count={newLeadsCount} color="bg-amber-500" />}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <CanadaClock />
            {shift?.shiftStart && (
              <Badge variant="success" className="hidden md:inline-flex shrink-0 whitespace-nowrap">
                Shift started {formatTime(shift.shiftStart)}
              </Badge>
            )}
            <Badge
              className={cn(
                'capitalize hidden sm:inline-flex border-transparent',
                user?.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-primary/10 text-primary'
              )}
            >
              {user?.role}
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onMouseEnter={() => setLogoutHover(true)}
              onMouseLeave={() => setLogoutHover(false)}
              onClick={() => setShiftDialogOpen(true)}
            >
              <LogOut size={16} animate={logoutHover} /> Log Out
            </Button>
          </div>
        </div>
        <nav className="sm:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600',
                  isActive && 'bg-accent text-accent-foreground'
                )
              }
            >
              {item.label}
              {item.badge === 'unread' && <NavBadge count={unreadCount} />}
              {item.badge === 'pendingReview' && isAdmin && <NavBadge count={pendingReviewCount} color="bg-indigo-600" />}
              {item.badge2 === 'newLeads' && <NavBadge count={newLeadsCount} color="bg-amber-500" />}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="container py-8">
        <Outlet />
      </main>

      <ShiftEndDialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen} shift={shift} onConfirm={handleShiftEnd} />
    </div>
  );
}
