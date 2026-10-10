import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api-error';
import { fakeAuth, renderWithProviders } from '@/test/render';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('shows inline errors and focuses the first invalid field', async () => {
    const login = vi.fn();
    renderWithProviders(<LoginPage />, { path: '/login', auth: fakeAuth({ login }) });

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toHaveFocus();
    expect(login).not.toHaveBeenCalled();
  });

  it('normalises the email before sending it', async () => {
    const login = vi.fn().mockResolvedValue({ user: { name: 'Demo User' } });
    renderWithProviders(<LoginPage />, {
      path: '/login',
      auth: fakeAuth({ login }),
      routes: [{ path: '/templates', element: <p>Templates</p> }],
    });

    await userEvent.type(screen.getByLabelText(/^Email/), '  Demo@Example.COM ');
    await userEvent.type(screen.getByLabelText(/^Password/), 'Demo@1234');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith({ email: 'demo@example.com', password: 'Demo@1234' });
    expect(await screen.findByText('Templates')).toBeInTheDocument();
  });

  it('shows the server message for wrong credentials', async () => {
    const login = vi
      .fn()
      .mockRejectedValue(
        new ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect'),
      );
    renderWithProviders(<LoginPage />, { path: '/login', auth: fakeAuth({ login }) });

    await userEvent.type(screen.getByLabelText(/^Email/), 'demo@example.com');
    await userEvent.type(screen.getByLabelText(/^Password/), 'Wrong@123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect');
  });
});
