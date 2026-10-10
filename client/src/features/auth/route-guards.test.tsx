import { screen } from '@testing-library/react';
import { Outlet } from 'react-router';
import { describe, expect, it } from 'vitest';
import { fakeAuth, renderWithProviders } from '@/test/render';
import { ProtectedRoute } from './route-guards';

function Guarded() {
  return (
    <>
      <ProtectedRoute />
      <Outlet />
    </>
  );
}

describe('ProtectedRoute', () => {
  it('sends guests to login and remembers where they were going', async () => {
    const { router } = renderWithProviders(<Guarded />, {
      path: '/favorites',
      initialEntry: '/favorites?q=blog',
      routes: [{ path: '/login', element: <p>Login page</p> }],
    });
    expect(await screen.findByText('Login page')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/login');
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe('/favorites?q=blog');
  });

  it('lets signed-in users through', () => {
    const { router } = renderWithProviders(<Guarded />, {
      path: '/favorites',
      auth: fakeAuth({ isAuthenticated: true }),
      routes: [{ path: '/login', element: <p>Login page</p> }],
    });
    expect(router.state.location.pathname).toBe('/favorites');
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
