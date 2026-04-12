/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication and/or specific roles.
 * 
 * Usage:
 *   // Require authentication only:
 *   <ProtectedRoute><Dashboard /></ProtectedRoute>
 * 
 *   // Require specific role:
 *   <ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>
 * 
 *   // Require any of multiple roles:
 *   <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']}><SharedPage /></ProtectedRoute>
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('STUDENT' | 'TEACHER' | 'ADMIN')[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show styled spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-400/30 border-t-emerald-400 animate-spin" />
          <p className="text-emerald-200/60 text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo || '/login'} replace />;
  }

  // Note: This is UI-only protection. All security enforcement
  // happens server-side via JWT validation in backend middleware.
  // Users can bypass these redirects but cannot access protected APIs.
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to custom path or access denied page
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }
      // Redirect to appropriate dashboard based on role
      const redirectPath = 
        user.role === 'ADMIN' ? '/admin' :
        user.role === 'TEACHER' ? '/teacher' : 
        '/student';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
}
