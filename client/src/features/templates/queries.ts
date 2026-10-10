import {
  type InfiniteData,
  type QueryClient,
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { type TemplateFilters, queryKeys } from '@/lib/query-keys';
import { isObjectId } from '@/lib/security';
import type { FavoriteTemplate, Order, Template } from '@/types/api';
import { type TemplatePage, templatesApi } from './api';

export const PAGE_SIZE = 12;

/** Paginated catalogue. Keeps the previous results visible while new filters load. */
export function useTemplateList(filters: TemplateFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.templates.list(filters),
    queryFn: ({ pageParam, signal }) =>
      templatesApi.list({ ...filters, page: pageParam, limit: PAGE_SIZE }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.total_pages ? last.meta.page + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.templates.categories(),
    queryFn: ({ signal }) => templatesApi.categories(signal),
    staleTime: 5 * 60_000,
  });
}

/** Finds a template already in any cached list, so the detail dialog opens instantly. */
export function findCachedTemplate(queryClient: QueryClient, id: string): Template | undefined {
  for (const [, data] of queryClient.getQueriesData<InfiniteData<TemplatePage>>({
    queryKey: queryKeys.templates.lists(),
  })) {
    for (const page of data?.pages ?? []) {
      const match = page.items.find((template) => template.id === id);
      if (match) return match;
    }
  }
  return (
    queryClient.getQueryData<FavoriteTemplate[]>(queryKeys.favorites)?.find((t) => t.id === id) ??
    queryClient.getQueryData<Order[]>(queryKeys.orders)?.find((o) => o.template.id === id)?.template
  );
}

export function useTemplate(id: string) {
  const queryClient = useQueryClient();
  return useQuery<Template, Error, Template, ReturnType<typeof queryKeys.templates.detail>>({
    queryKey: queryKeys.templates.detail(id),
    queryFn: ({ signal }) => templatesApi.get(id, signal),
    enabled: isObjectId(id),
    placeholderData: (previous: Template | undefined) =>
      previous ?? findCachedTemplate(queryClient, id),
  });
}

export const prefetchTemplate = (queryClient: QueryClient, id: string) =>
  queryClient.prefetchQuery({
    queryKey: queryKeys.templates.detail(id),
    queryFn: ({ signal }) => templatesApi.get(id, signal),
    staleTime: 60_000,
  });

/** Applies an update to a template wherever it is cached (lists, detail, favorites, library). */
export function patchCachedTemplate(
  queryClient: QueryClient,
  id: string,
  update: (template: Template) => Template,
) {
  queryClient.setQueriesData<InfiniteData<TemplatePage>>(
    { queryKey: queryKeys.templates.lists() },
    (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((template) =>
                template.id === id ? update(template) : template,
              ),
            })),
          }
        : data,
  );
  queryClient.setQueryData<Template>(queryKeys.templates.detail(id), (template) =>
    template ? update(template) : template,
  );
  queryClient.setQueryData<FavoriteTemplate[]>(queryKeys.favorites, (list) =>
    list?.map((template) => (template.id === id ? { ...template, ...update(template) } : template)),
  );
  queryClient.setQueryData<Order[]>(queryKeys.orders, (list) =>
    list?.map((order) =>
      order.template.id === id ? { ...order, template: update(order.template) } : order,
    ),
  );
}
