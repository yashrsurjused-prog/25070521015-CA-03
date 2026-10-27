import { Navigate, Outlet } from 'react-router-dom';

import useAuth from '../context/useAuth';
import PageLoader from './PageLoader';

function PublicOnlyRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <PageLoader label="Checking your session..." />;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={isAdmin ? '/admin/dashboard' : '/student/dashboard'}
        replace
      />
    );
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
