import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@/lib/storage';
import { renderWithProviders } from '@/test/render';
import { CookieNotice } from './CookieNotice';

describe('CookieNotice', () => {
  it('appears gently after first paint and is remembered once dismissed', () => {
    vi.useFakeTimers();
    renderWithProviders(<CookieNotice />);

    expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1300));
    expect(screen.getByRole('region', { name: 'Cookie notice' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));
    act(() => vi.advanceTimersByTime(200));

    expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem(STORAGE_KEYS.cookieNotice) ?? '{}').seenAt,
    ).toEqual(expect.any(Number));
  });

  it('stays hidden for visitors who already dismissed it', () => {
    vi.useFakeTimers();
    window.localStorage.setItem(STORAGE_KEYS.cookieNotice, JSON.stringify({ seenAt: Date.now() }));
    renderWithProviders(<CookieNotice />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole('region', { name: 'Cookie notice' })).not.toBeInTheDocument();
  });
});
