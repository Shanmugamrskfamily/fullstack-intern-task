import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { TemplateFilters } from '@/lib/query-keys';
import { cleanText } from '@/lib/security';
import type { PriceFilter, SortOption } from '@/types/api';
import { isCategorySlug } from './categories';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'price_desc', label: 'Highest price' },
];

export const PRICE_OPTIONS: { value: PriceFilter | null; label: string }[] = [
  { value: null, label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

const isSort = (value: unknown): value is SortOption =>
  SORT_OPTIONS.some((option) => option.value === value);

const isPrice = (value: unknown): value is PriceFilter => value === 'free' || value === 'paid';

type FilterPatch = Partial<{
  q: string | null;
  category: string | null;
  price: PriceFilter | null;
  sort: SortOption | null;
}>;

/**
 * Search, category, price and sort live in the URL: shareable, bookmarkable, and the back
 * button works. Values from the URL are untrusted, so they are cleaned and validated,
 * and anything invalid falls back to the default.
 */
export function useTemplateFilters() {
  const [params, setParams] = useSearchParams();

  const rawCategory = params.get('category');
  const rawSort = params.get('sort');
  const rawPrice = params.get('price');
  const search = cleanText(params.get('q') ?? '', 64);
  const category = isCategorySlug(rawCategory) ? rawCategory : null;
  const price = isPrice(rawPrice) ? rawPrice : null;
  const sort: SortOption = isSort(rawSort) ? rawSort : 'popular';

  const filters = useMemo<TemplateFilters>(
    () => ({ search, category, price, sort }),
    [search, category, price, sort],
  );

  const update = useCallback(
    (patch: FilterPatch) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(patch)) {
            if (!value || (key === 'sort' && value === 'popular')) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  return {
    filters,
    hasActiveFilters: Boolean(search || category || price),
    setSearch: useCallback((q: string) => update({ q }), [update]),
    setCategory: useCallback((value: string | null) => update({ category: value }), [update]),
    setPrice: useCallback((value: PriceFilter | null) => update({ price: value }), [update]),
    setSort: useCallback((value: SortOption) => update({ sort: value }), [update]),
    clearFilters: useCallback(() => update({ q: null, category: null, price: null }), [update]),
  };
}
