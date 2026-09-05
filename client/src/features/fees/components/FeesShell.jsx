import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import RightRail from '@/features/fees/components/RightRail.jsx';

const SECTIONS = [
  { to: '/fees/students', label: 'Students', roles: ['admin', 'registrar', 'partner', 'counsellor'] },
  { to: '/fees/partners', label: 'Partners', roles: ['admin', 'registrar'] },
  { to: '/fees/remittances', label: 'Remittances', roles: ['admin', 'registrar', 'partner'] },
  { to: '/fees/commission', label: 'Commission', roles: ['admin', 'registrar'] },
  { to: '/fees/refunds', label: 'Refunds', roles: ['admin', 'registrar'] },
  { to: '/fees/programs', label: 'Programs', roles: ['admin', 'registrar', 'partner', 'counsellor'] },
];

/** Shared shell for every /fees/* page: sub-nav across the fee sections + a right rail (action queue + ledger feed). */
export default function FeesShell({ children }) {
  const { user } = useAuth();
  const visible = SECTIONS.filter((s) => s.roles.includes(user?.role));

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-1 border-b pb-2">
        {visible.map((s) => (
          <NavLink
            key={s.to}
            to={s.to}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                isActive && 'bg-accent text-accent-foreground'
              )
            }
          >
            {s.label}
          </NavLink>
        ))}
      </nav>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0">{children}</div>
        <div className="hidden xl:block">
          <RightRail />
        </div>
      </div>
    </div>
  );
}
