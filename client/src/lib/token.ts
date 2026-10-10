import { jwtDecode } from 'jwt-decode';
import { STORAGE_KEYS, storage } from './storage';

/** The task brief asks for the JWT in localStorage; see README "Security notes" for the trade-off. */
export const tokenStorage = {
  get: () => storage.get(STORAGE_KEYS.token),
  set: (token: string) => storage.set(STORAGE_KEYS.token, token),
  clear: () => storage.remove(STORAGE_KEYS.token),
};

/**
 * Reads the expiry claim for UX only (auto sign-out timer). The server always verifies
 * the signature; the client never trusts the token's contents for authorisation.
 */
export function getTokenExpiry(token: string): number | null {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenUsable(token: string | null, skewMs = 5_000): token is string {
  if (!token) return false;
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry - skewMs > Date.now();
}
