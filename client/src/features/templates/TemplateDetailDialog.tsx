import { Check, FileText, Link2, SearchX } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ErrorState } from '@/components/feedback/States';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { ApiError } from '@/lib/api-error';
import { isObjectId, safeUrl } from '@/lib/security';
import { usePageTitle } from '@/lib/use-page-title';
import type { Template } from '@/types/api';
import { categoryColor } from './categories';
import { useTemplate } from './queries';
import { formatMonth, formatSaves } from './format';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-pressed rounded-[14px] px-3.5 py-3">
      <dt className="text-[11px] font-bold tracking-[0.06em] text-subtle uppercase">{label}</dt>
      <dd className="mt-1 text-[14.5px] font-bold">{value}</dd>
    </div>
  );
}

function DetailContent({ template }: { template: Template }) {
  const copyLink = async () => {
    const url = `${window.location.origin}/templates/${template.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied', { description: 'Share it with your team.' });
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-[1.2fr_1fr] sm:gap-8">
      <div>
        <div className="soft-inset overflow-hidden rounded-[20px] p-1.5">
          <img
            src={safeUrl(template.thumbnail_url)}
            alt={`Preview of the ${template.name} template`}
            width={640}
            height={400}
            className="aspect-[16/11] w-full rounded-2xl object-cover"
          />
        </div>
        {template.pages.length > 0 && (
          <ul aria-label="Pages included" className="mt-4 flex flex-wrap gap-2.5">
            {template.pages.map((page) => (
              <li
                key={page}
                className="soft-raised-sm flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-[12.5px] font-semibold text-muted-foreground"
              >
                <FileText className="size-[13px]" aria-hidden="true" /> {page}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col">
        <span className="soft-pressed inline-flex h-[30px] w-fit items-center gap-2 rounded-full px-3 text-[12.5px] font-bold">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: categoryColor(template.category_slug) }}
            aria-hidden="true"
          />
          {template.category}
        </span>
        <DialogTitle className="mt-4 pr-12">{template.name}</DialogTitle>
        <DialogDescription className="mt-2.5">{template.description}</DialogDescription>

        <dl className="my-5 grid grid-cols-3 gap-3">
          <Fact label="Category" value={template.category} />
          <Fact label="Saves" value={String(template.favorites_count)} />
          <Fact label="Added" value={formatMonth(template.created_at)} />
        </dl>

        {template.features.length > 0 && (
          <>
            <h3 className="mb-3 text-[13px] font-bold tracking-[0.04em] text-subtle uppercase">
              What's inside
            </h3>
            <ul className="mb-6 grid gap-2.5">
              {template.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-[14px] font-medium text-muted-foreground"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-success-soft text-success">
                    <Check className="size-[15px]" strokeWidth={2.6} aria-hidden="true" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="mt-auto flex flex-wrap gap-3">
          <FavoriteButton template={template} variant="full" />
          <Button size="lg" onClick={() => void copyLink()}>
            <Link2 className="size-[17px]" aria-hidden="true" /> Copy link
          </Button>
        </div>
        <p className="mt-3 text-[12.5px] text-subtle">{formatSaves(template.favorites_count)}</p>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-[1.2fr_1fr] sm:gap-8" aria-busy="true">
      <DialogTitle className="sr-only">Loading template</DialogTitle>
      <Skeleton className="aspect-[16/11] rounded-[20px]" />
      <div>
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="mt-5 h-8 w-3/4" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="mt-8 h-[52px] rounded-2xl" />
      </div>
    </div>
  );
}

/** Route component for /templates/:id: a dialog over the grid, deep-linkable and shareable. */
export default function TemplateDetailDialog() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const validId = isObjectId(id);
  const { data: template, error, isPending, refetch, isFetching } = useTemplate(id);
  usePageTitle(template?.name ?? 'Template');

  const close = () => {
    const state = location.state as { fromGrid?: boolean } | null;
    if (state?.fromGrid) navigate(-1);
    else {
      const parent = location.pathname.replace(/\/[^/]+\/?$/, '') || '/templates';
      navigate(
        { pathname: parent, search: location.search },
        { replace: true, preventScrollReset: true },
      );
    }
  };

  const notFound = !validId || (error instanceof ApiError && error.status === 404);

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          // The dialog is opened by a route, not a Radix trigger: return focus to the card link.
          event.preventDefault();
          window.requestAnimationFrame(() =>
            document
              .querySelector<HTMLElement>(`[data-template-link="${id}"]`)
              ?.focus({ preventScroll: true }),
          );
        }}
      >
        {notFound ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="soft-raised grid size-20 place-items-center rounded-[24px] text-subtle">
              <SearchX className="size-9" aria-hidden="true" />
            </span>
            <DialogTitle className="mt-5 text-[22px]">Template not found</DialogTitle>
            <DialogDescription className="mt-2 max-w-sm">
              This template may have been removed, or the link is incomplete.
            </DialogDescription>
            <Button asChild variant="primary" className="mt-6">
              <Link to="/templates">Browse all templates</Link>
            </Button>
          </div>
        ) : template ? (
          <DetailContent template={template} />
        ) : isPending ? (
          <DetailSkeleton />
        ) : (
          <div className="py-4">
            <DialogTitle className="sr-only">Couldn't load this template</DialogTitle>
            <ErrorState
              title="Couldn't load this template"
              message={error?.message ?? 'Please try again.'}
              onRetry={() => void refetch()}
              retrying={isFetching}
              className="shadow-none"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
