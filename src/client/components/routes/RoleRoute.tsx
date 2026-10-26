import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/store/authStore';
import type { UserRole } from '@/types/auth';

export function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { user, loading, isAuthenticated, hasRole } = useAuth();
  const unauthorized = isAuthenticated && !!user && !hasRole(roles);

  useEffect(() => {
    if (unauthorized) toast.error('You are not allowed to access that page.');
  }, [unauthorized]);

  if (loading) return <div className="grid min-h-[60vh] place-items-center text-[#74685f]">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || unauthorized) return <Navigate to="/blogs" replace />;
  return <Outlet />;
}
