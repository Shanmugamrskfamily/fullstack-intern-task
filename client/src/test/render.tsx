import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/features/auth/auth-context';
import { ThemeProvider } from '@/features/theme/ThemeProvider';

export const fakeAuth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  isAuthenticated: false,
  user: null,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

interface Options {
  path?: string;
  initialEntry?: string;
  auth?: AuthContextValue;
  /** Extra routes, e.g. a stub `/login` page to assert redirects. */
  routes?: { path: string; element: ReactNode }[];
}

/** Renders a component inside the same providers the app uses, with a memory router. */
export function renderWithProviders(
  ui: ReactNode,
  { path = '/', initialEntry = path, auth = fakeAuth(), routes = [] }: Options = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter([{ path, element: ui }, ...routes], {
    initialEntries: [initialEntry],
  });
  const utils = render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <RouterProvider router={router} />
        </AuthContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...utils, router, queryClient };
}
