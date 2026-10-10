import { Heart, LayoutGrid, Plus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { EmptyState, ErrorState } from '@/components/feedback/States';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/features/templates/SearchBar';
import { gridClassName } from '@/features/templates/format';
import { TemplateCard, TemplateCardSkeleton } from '@/features/templates/TemplateCard';
import { useCategories } from '@/features/templates/queries';
import { usePageTitle } from '@/lib/use-page-title';
import { pluralize } from '@/lib/utils';
import { useFavorites } from './queries';

export default function FavoritesPage() {
  usePageTitle('My favorites');
  const favorites = useFavorites();
  const categories = useCategories();
  const [search, setSearch] = useState('');

  const all = favorites.data ?? [];
  const needle = search.toLowerCase();
  const visible = needle
    ? all.filter((t) => `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(needle))
    : all;
  const catalogueSize = categories.data?.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const remaining = Math.max(0, catalogueSize - all.length);

  return (
    <>
      <div className="mt-8 mb-7 flex flex-col gap-5 lg:mt-11 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1
            id="page-title"
            tabIndex={-1}
            className="flex items-center gap-3.5 text-[32px] font-extrabold tracking-[-0.035em] outline-none sm:text-[38px]"
          >
            <span className="soft-raised grid size-[52px] place-items-center rounded-2xl text-rose">
              <Heart className="size-[26px] fill-current" aria-hidden="true" />
            </span>
            My Favorites
          </h1>
          <p className="mt-2.5 text-[15px] text-muted-foreground" aria-live="polite">
            {favorites.isPending
              ? 'Loading your shelf…'
              : all.length
                ? `${pluralize(all.length, 'template')} saved to your shelf. They follow you to every device you sign in on.`
                : 'Your saved templates live here.'}
          </p>
        </div>
        {all.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchBar
              value={search}
              onChange={setSearch}
              label="Search your favourites"
              placeholder="Search your favourites…"
              shortcut={false}
              debounceMs={150}
              className="sm:w-[340px] [&_[data-slot=input-shell]]:h-[52px]"
            />
            <Button asChild variant="primary">
              <Link to="/templates">
                <LayoutGrid className="size-[17px]" aria-hidden="true" /> Browse templates
              </Link>
            </Button>
          </div>
        )}
      </div>

      {favorites.isPending ? (
        <div className={gridClassName} aria-busy="true" aria-label="Loading favourites">
          {Array.from({ length: 4 }, (_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : favorites.isError && !favorites.data ? (
        <ErrorState
          title="Couldn't load your favourites"
          message={favorites.error.message}
          onRetry={() => void favorites.refetch()}
          retrying={favorites.isFetching}
        />
      ) : all.length === 0 ? (
        <EmptyState
          icon={<Heart className="text-rose" aria-hidden="true" />}
          title="No favourites yet"
          description="Tap the heart on any template to save it here. Your shelf syncs to your account."
          action={
            <Button asChild variant="primary" size="lg">
              <Link to="/templates">
                <LayoutGrid className="size-[17px]" aria-hidden="true" /> Browse templates
              </Link>
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<SearchX aria-hidden="true" />}
          title={`No favourites match “${search}”`}
          description="Try another keyword or clear the search."
          action={<Button onClick={() => setSearch('')}>Clear search</Button>}
        />
      ) : (
        <ul className={gridClassName} aria-label="Favourite templates">
          {visible.map((template, index) => (
            <li key={template.id} className="flex">
              <div className="flex w-full flex-col [&>article]:flex-1">
                <TemplateCard template={template} index={index} basePath="/favorites" />
              </div>
            </li>
          ))}
          {!search && remaining > 0 && (
            <li className="flex">
              <Link
                to="/templates"
                className="soft-pressed flex w-full flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-line p-6 text-center text-muted-foreground transition hover:text-primary-text"
              >
                <span className="soft-raised-sm grid size-[58px] place-items-center rounded-[18px] text-primary-text">
                  <Plus className="size-6" aria-hidden="true" />
                </span>
                <b className="mt-3.5 text-[15.5px] text-foreground">Discover more</b>
                <span className="mt-1 text-[13.5px]">
                  {pluralize(remaining, 'more template')} waiting in the store.
                </span>
              </Link>
            </li>
          )}
        </ul>
      )}
      <Outlet />
    </>
  );
}
