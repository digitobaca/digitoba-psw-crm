import { Navigate } from 'react-router-dom';
import { usePortalAuth } from '@/hooks/usePortalAuth';

/** Redirects to /portal/login unless a student portal session is active. */
export default function PortalProtectedRoute({ children }) {
  const { isAuthenticated, loading } = usePortalAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }

  return children;
}
