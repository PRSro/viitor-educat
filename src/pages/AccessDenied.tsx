/**
 * Access Denied Page
 * 
 * Shown when a user tries to access a route they don't have permission for.
 */

import { ErrorDisplay } from '@/components/ErrorDisplay';

export default function AccessDenied() {
  return (
    <ErrorDisplay
      type="forbidden"
      message="You don't have permission to access this page. Please contact an administrator if you believe this is an error."
    />
  );
}
