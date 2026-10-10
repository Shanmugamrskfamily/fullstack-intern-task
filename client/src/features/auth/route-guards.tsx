import { useState } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { safeNextPath } from '@/lib/security';
import { useAuth } from './auth-context';

/** Only signed-in users may see the nested routes; guests go to login and come back after. */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
}

/**
 * Login/register are for guests. A user who is already signed in when they open the page
 * is sent on; after a successful sign-in the page itself decides where to go next.
 */
export function GuestRoute() {
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [signedInOnArrival] = useState(isAuthenticated);

  if (signedInOnArrival) return <Navigate to={safeNextPath(searchParams.get('next'))} replace />;
  return <Outlet />;
}
