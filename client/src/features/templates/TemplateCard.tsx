import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { safeUrl } from '@/lib/security';
import { cn } from '@/lib/utils';
import type { Template } from '@/types/api';
import { categoryColor } from './categories';
import { formatSaves } from './format';
import { prefetchTemplate } from './queries';

interface TemplateCardProps {
  template: Template;
  /** Position in its page, for the staggered entrance and eager loading of the first row. */
  index?: number;
  /** Route the detail dialog opens under (`/templates` or `/favorites`). */
  basePath?: string;
}

export function TemplateCard({ template, index = 0, basePath = '/templates' }: TemplateCardProps) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const prefetch = () => void prefetchTemplate(queryClient, template.id);

  return (
    <article
      className="group soft-raised animate-card-in relative flex flex-col rounded-[22px] p-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:soft-lifted focus-within:soft-lifted"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      onMouseEnter={prefetch}
      onFocus={prefetch}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-inset">
        <img
          src={safeUrl(template.thumbnail_url)}
          alt={`Preview of the ${template.name} template`}
          width={640}
          height={400}
          loading={index < 4 ? 'eager' : 'lazy'}
          decoding="async"
          className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
        <span className="absolute top-2.5 left-2.5 flex h-7 items-center gap-1.5 rounded-full bg-white/92 px-2.5 text-[12px] font-bold text-[#1B2433] shadow-[0_2px_8px_rgb(15_23_42/0.12)]">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: categoryColor(template.category_slug) }}
            aria-hidden="true"
          />
          {template.category}
        </span>
        <FavoriteButton template={template} className="absolute top-2.5 right-2.5 z-10" />
      </div>

      <div className="px-1.5 pt-4 pb-0.5">
        <h3 className="text-[16.5px] font-bold tracking-[-0.01em]">
          {/* Stretched link: the whole card is clickable, but there is a single link and no nested buttons. */}
          <Link
            to={{ pathname: `${basePath}/${template.id}`, search: location.search }}
            state={{ fromGrid: true }}
            preventScrollReset
            data-template-link={template.id}
            className="outline-none after:absolute after:inset-0 after:rounded-[22px]"
          >
            {template.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13.8px] leading-relaxed text-muted-foreground">
          {template.description}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between px-1 pt-3.5 pb-0.5">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-subtle tabular-nums">
          <Heart className="size-3.5" aria-hidden="true" />
          {formatSaves(template.favorites_count)}
        </span>
        <span
          aria-hidden="true"
          className="soft-raised-sm flex h-[34px] items-center gap-1.5 rounded-[11px] px-3 text-[13px] font-bold text-primary-text transition group-hover:gap-2"
        >
          Details <ArrowRight className="size-[15px]" />
        </span>
      </div>
    </article>
  );
}

export function TemplateCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('soft-raised rounded-[22px] p-3', className)} aria-hidden="true">
      <Skeleton className="aspect-[16/10] rounded-2xl" />
      <Skeleton className="mx-1.5 mt-4 h-4 w-3/4" />
      <Skeleton className="mx-1.5 mt-3 h-3 w-[92%]" />
      <Skeleton className="mx-1.5 mt-2 h-3 w-3/5" />
      <div className="mt-5 flex justify-between px-1.5 pb-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-[30px] w-20 rounded-[11px]" />
      </div>
    </div>
  );
}
