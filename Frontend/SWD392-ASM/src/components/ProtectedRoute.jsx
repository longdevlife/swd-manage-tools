import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { selectCurrentUser, selectIsAuthenticated } from '@/stores/authSlice';

/**
 * Wraps a route and redirects if the user lacks required auth or role.
 * @param {string} [role] - Required role (e.g. 'ROLE_ADMIN'). If omitted, only checks authentication.
 */
export function ProtectedRoute({ children, role }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
