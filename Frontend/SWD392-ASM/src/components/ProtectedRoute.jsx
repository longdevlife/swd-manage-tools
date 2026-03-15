import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectCurrentUser, selectIsAuthenticated } from '@/stores/authSlice';

/**
 * Wraps a route and redirects if the user lacks required auth or role.
 * @param {string} [role] - Required role (e.g. 'ADMIN' or 'ROLE_ADMIN'). If omitted, only checks authentication.
 */
export function ProtectedRoute({ children, role }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    // Normalize: strip "ROLE_" prefix if present for comparison
    const requiredRole = role.replace(/^ROLE_/i, '');
    // Build user's roles list from both possible formats
    const userRoles = user?.roles ?? (user?.role ? [user.role] : []);
    const hasRole = userRoles.some(
      (r) => r.replace(/^ROLE_/i, '') === requiredRole
    );
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

