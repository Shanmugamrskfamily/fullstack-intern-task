import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { announce } from '@/lib/announce';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { type Theme, ThemeContext } from './theme-context';

const THEME_COLOR: Record<Theme, string> = { light: '#E7ECF3', dark: '#161B24' };

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

/** Light by default; the user's choice is saved and restored on every visit (no flash). */
const readInitialTheme = (): Theme =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    storage.set(STORAGE_KEYS.theme, next);
    setThemeState(next);
    announce(`${next === 'dark' ? 'Dark' : 'Light'} theme on`);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
  }, [setTheme]);

  // Keep every open tab in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEYS.theme) return;
      const next: Theme = event.newValue === 'dark' ? 'dark' : 'light';
      applyTheme(next);
      setThemeState(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
