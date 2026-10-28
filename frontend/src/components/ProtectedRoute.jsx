import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { getCurrentSession, getHomeRoute } from '../utils/auth.js';

/** Protect a client-side route and optionally restrict it to one role.
 *
 * Args:
 *   children: Route content to show after session and role checks.
 *   requiredRole: Optional role required to view the route.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const session = getCurrentSession();
  if (!session) {
    return <Navigate replace to="/login" />;
  }
  if (requiredRole && session.role !== requiredRole) {
    return <Navigate replace to={getHomeRoute(session)} />;
  }
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOf(['admin', 'user']),
};
