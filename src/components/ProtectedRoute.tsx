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

  // Show nothing while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions if specified
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
