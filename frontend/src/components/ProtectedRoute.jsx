import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState fullPage message="Authenticating session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length > 0) {
    const userRole = user.role || 'creator';
    const isAdmin = userRole === 'admin' || userRole === 'platform_admin';

    // Admins always have access
    if (!isAdmin) {
      const normalizedUserRole =
        userRole === 'content_creator' ? 'creator' : userRole;

      const hasAccess = roles.some((r) => {
        const normalizedRole = r === 'content_creator' ? 'creator' : r;
        if (normalizedRole === normalizedUserRole) return true;
        if (r === 'reviewer' && userRole === 'reviewer') return true;
        return false;
      });

      if (!hasAccess) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
}
