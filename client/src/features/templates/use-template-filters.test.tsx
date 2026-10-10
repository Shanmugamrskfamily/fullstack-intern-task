import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { useTemplateFilters } from './use-template-filters';

function Probe() {
  const { filters, hasActiveFilters } = useTemplateFilters();
  return <pre data-testid="filters">{JSON.stringify({ ...filters, hasActiveFilters })}</pre>;
}

const readFilters = () => JSON.parse(screen.getByTestId('filters').textContent ?? '{}');

describe('useTemplateFilters', () => {
  it('reads valid filters from the URL', () => {
    renderWithProviders(<Probe />, {
      path: '/templates',
      initialEntry: '/templates?q=%20dash%20&category=blog&price=free&sort=price_asc',
    });
    expect(readFilters()).toEqual({
      search: 'dash',
      category: 'blog',
      price: 'free',
      sort: 'price_asc',
      hasActiveFilters: true,
    });
  });

  it('falls back to safe defaults for tampered URL values', () => {
    renderWithProviders(<Probe />, {
      path: '/templates',
      initialEntry: `/templates?category=${encodeURIComponent('{"$gt":""}')}&sort=drop-table&price=cheap&q=${'x'.repeat(200)}`,
    });
    const filters = readFilters();
    expect(filters.category).toBeNull();
    expect(filters.sort).toBe('popular');
    expect(filters.price).toBeNull();
    expect(filters.search).toHaveLength(64);
  });
});
