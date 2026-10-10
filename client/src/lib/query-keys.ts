import type { SortOption } from '@/types/api';

export interface TemplateFilters {
  search: string;
  category: string | null;
  sort: SortOption;
}

/** Query-key factory: one place that defines every cache entry the app uses. */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  templates: {
    all: ['templates'] as const,
    lists: () => [...queryKeys.templates.all, 'list'] as const,
    list: (filters: TemplateFilters) => [...queryKeys.templates.lists(), filters] as const,
    categories: () => [...queryKeys.templates.all, 'categories'] as const,
    detail: (id: string) => [...queryKeys.templates.all, 'detail', id] as const,
  },
  favorites: ['favorites'] as const,
  health: ['health'] as const,
};
