import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/** Redirects to the Students tab when the current role isn't in `roles` — keeps a misdirected user inside the Fees section rather than bouncing them out of it. */
export default function RoleGate({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <Navigate to="/fees/students" replace />;
  return children;
}
