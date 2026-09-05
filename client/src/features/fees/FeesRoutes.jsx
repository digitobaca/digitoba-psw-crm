import { Routes, Route, Navigate } from 'react-router-dom';
import FeesShell from '@/features/fees/components/FeesShell.jsx';
import RoleGate from '@/features/fees/components/RoleGate.jsx';
import StudentsPage from '@/features/fees/pages/StudentsPage.jsx';
import StudentLedgerPage from '@/features/fees/pages/StudentLedgerPage.jsx';
import PartnersPage from '@/features/fees/pages/PartnersPage.jsx';
import PartnerDetailPage from '@/features/fees/pages/PartnerDetailPage.jsx';
import RemittancesPage from '@/features/fees/pages/RemittancesPage.jsx';
import CommissionPage from '@/features/fees/pages/CommissionPage.jsx';
import RefundsPage from '@/features/fees/pages/RefundsPage.jsx';
import ProgramsPage from '@/features/fees/pages/ProgramsPage.jsx';
import ProgramDetailPage from '@/features/fees/pages/ProgramDetailPage.jsx';

const REGISTRAR_ADMIN = ['admin', 'registrar'];

/**
 * The entire Fee Ledger route group, lazy-loaded as one chunk from App.jsx
 * (`const FeesRoutes = lazy(() => import('@/features/fees/FeesRoutes.jsx'))`)
 * so it doesn't grow the main bundle. Mounted at /fees/*, inside the same
 * ProtectedRoute + AdminLayout shell as /admin/* (see App.jsx) — a separate
 * top-level route tree, not nested under /admin, per BUILD PROMPT section 6,
 * but reusing the existing staff layout/sidebar per constraint #2.
 */
export default function FeesRoutes() {
  return (
    <FeesShell>
      <Routes>
        <Route index element={<Navigate to="students" replace />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<StudentLedgerPage />} />
        <Route
          path="partners"
          element={
            <RoleGate roles={REGISTRAR_ADMIN}>
              <PartnersPage />
            </RoleGate>
          }
        />
        <Route
          path="partners/:id"
          element={
            <RoleGate roles={REGISTRAR_ADMIN}>
              <PartnerDetailPage />
            </RoleGate>
          }
        />
        <Route path="remittances" element={<RemittancesPage />} />
        <Route
          path="commission"
          element={
            <RoleGate roles={REGISTRAR_ADMIN}>
              <CommissionPage />
            </RoleGate>
          }
        />
        <Route
          path="refunds"
          element={
            <RoleGate roles={REGISTRAR_ADMIN}>
              <RefundsPage />
            </RoleGate>
          }
        />
        <Route path="programs" element={<ProgramsPage />} />
        <Route path="programs/:id" element={<ProgramDetailPage />} />
        <Route path="*" element={<Navigate to="students" replace />} />
      </Routes>
    </FeesShell>
  );
}
