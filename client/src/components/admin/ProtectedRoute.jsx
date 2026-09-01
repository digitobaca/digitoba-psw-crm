import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Redirects to /admin/login unless a team member session is active.
 * Pass `roles={['admin']}` to additionally gate a route to specific roles
 * (e.g. counsellor management, analytics) — a logged-in counsellor hitting
 * an admin-only route is redirected to their own dashboard instead of
 * being logged out.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
