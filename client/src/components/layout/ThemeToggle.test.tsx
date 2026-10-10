import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('starts in light mode and remembers the choice', async () => {
    renderWithProviders(<ThemeToggle />);
    expect(document.documentElement).not.toHaveClass('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(window.localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(window.localStorage.getItem(STORAGE_KEYS.theme)).toBe('light');
  });
});
