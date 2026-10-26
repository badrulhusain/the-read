import { Navigate, Outlet } from 'react-router-dom';
import { roleHome, useAuth } from '@/store/authStore';

export function PublicOnlyRoute() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center text-[#74685f]">Loading session...</div>;
  }

  if (isAuthenticated && user) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <Outlet />;
}
