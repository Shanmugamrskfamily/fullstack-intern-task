import { Layers, SearchX, X } from 'lucide-react';
import { Outlet } from 'react-router';
import { EmptyState, ErrorState } from '@/components/feedback/States';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useFavorites } from '@/features/favorites/queries';
import { usePageTitle } from '@/lib/use-page-title';
import { pluralize } from '@/lib/utils';
import { CategoryChips } from './CategoryChips';
import { CATEGORIES } from './categories';
import { LaunchOfferBanner } from './LaunchOfferBanner';
import { PriceFilter } from './PriceFilter';
import { PAGE_SIZE, useCategories, useTemplateList } from './queries';
import { SearchBar } from './SearchBar';
import { SortSelect } from './SortSelect';
import { gridClassName } from './format';
import { TemplateCard, TemplateCardSkeleton } from './TemplateCard';
import { useTemplateFilters } from './use-template-filters';

export default function TemplatesPage() {
  usePageTitle('Templates');
  const { filters, hasActiveFilters, setSearch, setCategory, setPrice, setSort, clearFilters } =
    useTemplateFilters();
  const list = useTemplateList(filters);
  const categories = useCategories();
  const { isAuthenticated } = useAuth();
  const favorites = useFavorites();

  const templates = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.meta.total ?? 0;
  const catalogueSize = categories.data?.reduce((sum, category) => sum + category.count, 0);
  const categoryName = CATEGORIES.find((category) => category.slug === filters.category)?.name;
  const refreshing = list.isFetching && !list.isFetchingNextPage && !list.isPending;

  return (
    <>
      <section className="mt-8 mb-7 grid items-end gap-6 lg:mt-11 lg:mb-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <span className="soft-raised-sm inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-bold tracking-[0.09em] text-primary-text uppercase">
            <Layers className="size-[15px]" aria-hidden="true" /> Mini SaaS Template Store
          </span>
          <h1
            id="page-title"
            tabIndex={-1}
            className="mt-4 text-[34px] leading-[1.08] font-extrabold tracking-[-0.035em] [word-spacing:0.06em] outline-none sm:text-[40px] lg:text-[46px]"
          >
            Find the template that <span className="text-gradient">ships your next idea.</span>
          </h1>
          <p className="mt-3 max-w-[540px] text-[16px] leading-relaxed text-muted-foreground">
            {catalogueSize ? `${catalogueSize} hand-picked` : 'Hand-picked'} SaaS templates, free
            and paid. Search, filter by category or price, save favourites and build your library.
          </p>
        </div>
        <SearchBar value={filters.search} onChange={setSearch} />
      </section>

      <LaunchOfferBanner />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <CategoryChips value={filters.category} onChange={setCategory} counts={categories.data} />
        <div className="flex shrink-0 items-center justify-between gap-3 lg:py-2">
          <PriceFilter value={filters.price} onChange={setPrice} />
          <SortSelect value={filters.sort} onChange={setSort} />
        </div>
      </div>

      <div className="mt-4 mb-4 flex items-center justify-between gap-3 px-0.5 text-[13.5px] text-subtle sm:mt-5">
        <p aria-live="polite">
          {list.isPending ? (
            'Loading templates…'
          ) : (
            <>
              Showing{' '}
              <b className="text-muted-foreground tabular-nums">
                {templates.length} of {total}
              </b>{' '}
              {filters.price && <>{filters.price} </>}
              {total === 1 ? 'template' : 'templates'}
              {categoryName && <> in {categoryName}</>}
              {filters.search && <> matching “{filters.search}”</>}
            </>
          )}
        </p>
        {isAuthenticated && favorites.data && (
          <p className="hidden sm:block">
            {pluralize(favorites.data.length, 'template')} in your favourites
          </p>
        )}
      </div>

      <div className="relative">
        {refreshing && (
          <div
            className="absolute inset-x-0 -top-2.5 h-[3px] overflow-hidden rounded-full"
            aria-hidden="true"
          >
            <div className="animate-indeterminate absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-[#818CF8] to-primary" />
          </div>
        )}

        {list.isPending ? (
          <div className={gridClassName} aria-busy="true" aria-label="Loading templates">
            {Array.from({ length: 8 }, (_, i) => (
              <TemplateCardSkeleton key={i} />
            ))}
          </div>
        ) : list.isError && !list.data ? (
          <ErrorState
            title="Couldn't load templates"
            message={`${list.error.message} Your favourites are safe.`}
            onRetry={() => void list.refetch()}
            retrying={list.isFetching}
          />
        ) : templates.length === 0 ? (
          <EmptyState
            icon={<SearchX aria-hidden="true" />}
            title={
              filters.search
                ? `No templates match “${filters.search}”`
                : filters.price
                  ? `No ${filters.price} templates in this category yet`
                  : 'No templates in this category yet'
            }
            description="Try a different keyword, or clear the filters to see every template."
            action={
              hasActiveFilters && (
                <Button onClick={clearFilters}>
                  <X className="size-4" aria-hidden="true" /> Clear filters
                </Button>
              )
            }
          />
        ) : (
          <ul className={gridClassName} aria-label="Templates">
            {templates.map((template, index) => (
              <li key={template.id} className="flex">
                <div className="flex w-full flex-col [&>article]:flex-1">
                  <TemplateCard
                    template={template}
                    index={index % PAGE_SIZE}
                    highlight={filters.search}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {list.hasNextPage && (
        <div className="mt-9 flex justify-center">
          <Button
            size="lg"
            onClick={() => void list.fetchNextPage()}
            loading={list.isFetchingNextPage}
            loadingText="Loading more…"
          >
            Load more templates
          </Button>
        </div>
      )}

      {/* Detail dialog route (/templates/:id) renders over the grid. */}
      <Outlet />
    </>
  );
}
