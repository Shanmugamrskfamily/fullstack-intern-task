import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeAuth, renderWithProviders } from '@/test/render';
import type { FavoriteTemplate, Template } from '@/types/api';
import { favoritesApi } from './api';
import { FavoriteButton } from './FavoriteButton';

const template: Template = {
  id: '6ac995a872350e709d29007e',
  name: 'Pulse Analytics',
  slug: 'pulse-analytics',
  description: 'Real-time analytics dashboard.',
  thumbnail_url: 'https://api.example.com/static/thumbnails/pulse-analytics.svg',
  category: 'Dashboard',
  category_slug: 'dashboard',
  features: [],
  pages: [],
  favorites_count: 2,
  created_at: '2026-10-06T09:00:00.000Z',
};

describe('FavoriteButton', () => {
  it('sends guests to sign in, keeping their intent to save this template', async () => {
    const { router } = renderWithProviders(<FavoriteButton template={template} />, {
      path: '/templates',
      routes: [{ path: '/login', element: <p>Login page</p> }],
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'Save Pulse Analytics to favorites' }),
    );

    expect(await screen.findByText('Login page')).toBeInTheDocument();
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get('next')).toBe('/templates');
    expect(params.get('intent')).toBe(`favorite:${template.id}`);
  });

  it('shows the saved state and removes optimistically', async () => {
    // A tiny fake server: the list reflects removals, like the real API.
    const saved: FavoriteTemplate = { ...template, favorited_at: '2026-10-10T00:00:00.000Z' };
    let serverFavorites: FavoriteTemplate[] = [saved];
    vi.spyOn(favoritesApi, 'list').mockImplementation(async () => serverFavorites);
    const remove = vi.spyOn(favoritesApi, 'remove').mockImplementation(async () => {
      serverFavorites = [];
    });

    renderWithProviders(<FavoriteButton template={template} />, {
      path: '/templates',
      auth: fakeAuth({ isAuthenticated: true }),
    });

    const button = await screen.findByRole('button', {
      name: 'Remove Pulse Analytics from favorites',
    });
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(button);

    expect(
      await screen.findByRole('button', { name: 'Save Pulse Analytics to favorites' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(remove).toHaveBeenCalledWith(template.id);
  });
});
