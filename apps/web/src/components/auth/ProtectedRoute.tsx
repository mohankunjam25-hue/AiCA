import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '@aica/shared';
import { AccessDeniedView } from '../../pages/AccessDeniedView';
import { PageLoadingFallback } from '../ui/PageLoadingFallback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true
}: ProtectedRouteProps) {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // If silent background auth check is in flight, display non-flickering fallback
  if (isInitializing) {
    return <PageLoadingFallback message="Authenticating session..." />;
  }

  // If route requires authentication and user is not signed in
  if (requireAuth && !isAuthenticated) {
    const redirectUrl = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }

  // If route has specific allowed roles and user's role is not authorized
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return (
        <AccessDeniedView
          requiredRoles={allowedRoles}
          currentRole={userRole}
        />
      );
    }
  }

  return <>{children}</>;
}
