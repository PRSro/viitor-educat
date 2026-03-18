/**
 * Access Denied Page
 * 
 * Shown when a user tries to access a route they don't have permission for.
 */

import { ErrorDisplay } from '@/components/ErrorDisplay';
import { PageBackground } from '@/components/PageBackground';

export default function AccessDenied() {
  return (
    <PageBackground>
      <ErrorDisplay
        type="forbidden"
        message="You don't have permission to access this page. Please contact an administrator if you believe this is an error."
      />
    </PageBackground>
  );
}
