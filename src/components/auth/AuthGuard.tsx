import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildLoginRedirectUrl } from '@/app/route-constants';
import LoadingSpinner from '@/components/common/loading/LoadingSpinner';
import { useAuthStore } from '@/stores/auth-store';

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTo = buildLoginRedirectUrl(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
