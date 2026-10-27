import { Navigate, Outlet, useLocation } from 'react-router-dom';

import useAuth from '../context/useAuth';
import PageLoader from './PageLoader';

function ProtectedRoute({ allowedRoles, redirectTo = '/login' }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user?.role)) {
    const fallbackPath = user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
