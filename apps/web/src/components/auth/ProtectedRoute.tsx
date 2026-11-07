import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '@aica/shared';
import { AccessDeniedView } from '../../pages/AccessDeniedView';

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

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
