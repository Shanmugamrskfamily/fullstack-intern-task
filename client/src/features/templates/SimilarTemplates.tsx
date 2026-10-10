import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { useOwnedTemplates } from '@/features/orders/queries';
import { queryKeys } from '@/lib/query-keys';
import { safeUrl } from '@/lib/security';
import type { Template } from '@/types/api';
import { templatesApi } from './api';
import { PriceTag } from './PriceTag';

const COUNT = 3;

/** "More in <category>": a scrollable row on phones, three columns from tablets up. */
export function SimilarTemplates({ template }: { template: Template }) {
  const location = useLocation();
  const owned = useOwnedTemplates();
  const { data, isPending } = useQuery({
    queryKey: queryKeys.templates.similar(template.category_slug),
    queryFn: ({ signal }) =>
      templatesApi.list(
        { category: template.category_slug, sort: 'popular', limit: COUNT + 1 },
        signal,
      ),
    staleTime: 5 * 60_000,
  });

  const items = (data?.items ?? []).filter((item) => item.id !== template.id).slice(0, COUNT);
  if (!isPending && items.length === 0) return null;

  // Stay under the page the dialog was opened from (/templates, /favorites or /library).
  const basePath = location.pathname.replace(/\/[^/]+\/?$/, '') || '/templates';

  return (
    <section aria-labelledby="similar-title" className="mt-7 border-t border-line pt-6">
      <h3
        id="similar-title"
        className="mb-4 text-[13px] font-bold tracking-[0.04em] text-subtle uppercase"
      >
        More {template.category} templates
      </h3>
      <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pt-1 pb-3 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-1">
        {isPending
          ? Array.from({ length: COUNT }, (_, i) => (
              <li key={i} className="w-[232px] shrink-0 sm:w-auto" aria-hidden="true">
                <Skeleton className="aspect-[16/10] rounded-[18px]" />
                <Skeleton className="mt-3 h-4 w-3/4" />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id} className="w-[232px] shrink-0 snap-start sm:w-auto">
                <Link
                  to={{ pathname: `${basePath}/${item.id}`, search: location.search }}
                  // Swap the dialog in place, so closing still returns to the grid.
                  replace
                  state={location.state}
                  preventScrollReset
                  className="soft-raised-sm group flex h-full flex-col rounded-[18px] p-2 transition-[transform] duration-200 hover:-translate-y-0.5"
                >
                  <span className="block overflow-hidden rounded-[13px] bg-inset">
                    <img
                      src={safeUrl(item.thumbnail_url)}
                      alt=""
                      width={640}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  </span>
                  <span className="flex items-center justify-between gap-2 px-1.5 pt-2.5 pb-1">
                    <span className="truncate text-[14px] font-bold">{item.name}</span>
                    <PriceTag
                      template={item}
                      owned={owned.has(item.id)}
                      compact
                      className="shrink-0 text-[13.5px]"
                    />
                  </span>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
