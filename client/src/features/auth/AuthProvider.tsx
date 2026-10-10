import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { UNAUTHORIZED_EVENT, authEvents } from '@/lib/http';
import { queryKeys } from '@/lib/query-keys';
import { STORAGE_KEYS } from '@/lib/storage';
import { getTokenExpiry, isTokenUsable, tokenStorage } from '@/lib/token';
import type { Session } from '@/types/api';
import { authApi } from './api';
import { AuthContext } from './auth-context';
import type { LoginValues, RegisterPayload } from './schemas';

type EndReason = 'manual' | 'expired' | 'other-tab';

const readStoredToken = () => {
  const token = tokenStorage.get();
  if (isTokenUsable(token)) return token;
  tokenStorage.clear(); // expired or malformed: start signed out
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState<string | null>(readStoredToken);

  // Latest location, readable from event handlers without re-subscribing.
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const { data: user = null } = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });

  const endSession = useCallback(
    (reason: EndReason) => {
      tokenStorage.clear();
      setToken(null);
      queryClient.removeQueries({ queryKey: queryKeys.me });
      queryClient.removeQueries({ queryKey: queryKeys.favorites });

      if (reason === 'manual') {
        toast.success('Signed out', {
          description: 'Your favourites will be here when you return.',
        });
      } else if (reason === 'other-tab') {
        toast.info('Signed out', { description: 'You signed out in another tab.' });
      } else {
        const { pathname, search } = locationRef.current;
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
          action: {
            label: 'Sign in',
            onClick: () => navigate(`/login?next=${encodeURIComponent(pathname + search)}`),
          },
        });
      }
    },
    [navigate, queryClient],
  );

  const startSession = useCallback(
    (session: Session) => {
      tokenStorage.set(session.token);
      setToken(session.token);
      queryClient.setQueryData(queryKeys.me, session.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    },
    [queryClient],
  );

  const login = useCallback(
    async (input: LoginValues) => {
      const session = await authApi.login(input);
      startSession(session);
      return session;
    },
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterPayload) => {
      const session = await authApi.register(input);
      startSession(session);
      return session;
    },
    [startSession],
  );

  const logout = useCallback(() => endSession('manual'), [endSession]);

  // Sign out automatically the moment the token expires.
  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    const timer = window.setTimeout(
      () => endSession('expired'),
      Math.max(0, Math.min(expiry - Date.now(), 2 ** 31 - 1)),
    );
    return () => window.clearTimeout(timer);
  }, [token, endSession]);

  // Any request that comes back 401 (revoked or expired) ends the session.
  useEffect(() => {
    const onUnauthorized = () => {
      if (tokenStorage.get()) endSession('expired');
    };
    authEvents.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => authEvents.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [endSession]);

  // Signing in or out in one tab updates every other tab.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEYS.token) return;
      if (!event.newValue) {
        setToken(null);
        queryClient.removeQueries({ queryKey: queryKeys.me });
        queryClient.removeQueries({ queryKey: queryKeys.favorites });
        toast.info('Signed out', { description: 'You signed out in another tab.' });
      } else if (isTokenUsable(event.newValue)) {
        setToken(event.newValue);
        void queryClient.invalidateQueries({ queryKey: queryKeys.me });
        void queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [queryClient]);

  const value = useMemo(
    () => ({ isAuthenticated: Boolean(token), user, login, register, logout }),
    [token, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
