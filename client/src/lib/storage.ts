/**
 * localStorage can throw (private mode, blocked site data). Every read and write goes
 * through these helpers so the app still works, just without persistence.
 */
export const STORAGE_KEYS = {
  token: 'layora:token',
  theme: 'layora:theme',
  cookieNotice: 'layora:cookie-notice',
} as const;

export const storage = {
  get(key: string): string | null {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
  remove(key: string): void {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
};
