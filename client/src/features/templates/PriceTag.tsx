import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/types/api';
import { formatInr } from './format';

interface PriceTagProps {
  template: Pick<Template, 'price_inr' | 'is_free' | 'original_price_inr'>;
  owned?: boolean;
  /** Price only, without the struck-through list price (small cards). */
  compact?: boolean;
  className?: string;
}

const pill =
  'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-extrabold whitespace-nowrap';

/**
 * Price on cards: the offer price with the list price (M.R.P.) struck through, a green
 * "Free" pill, or "Owned" once the template is in the user's library.
 */
export function PriceTag({ template, owned = false, compact = false, className }: PriceTagProps) {
  if (owned) {
    return (
      <span className={cn(pill, 'bg-primary-soft text-primary-text', className)}>
        <BadgeCheck className="size-3.5" aria-hidden="true" /> Owned
      </span>
    );
  }
  if (template.is_free) {
    return (
      <span
        className={cn(
          pill,
          'bg-gradient-to-r from-[#059669] to-[#0D9488] text-white shadow-[0_6px_14px_-6px_rgb(5_150_105/0.65)]',
          className,
        )}
      >
        Free
      </span>
    );
  }
  const original = template.original_price_inr;
  return (
    <span className={cn('flex flex-col items-end gap-1 leading-none', className)}>
      <span className="text-[15.5px] font-extrabold whitespace-nowrap tabular-nums">
        {formatInr(template.price_inr)}
      </span>
      {!compact && original !== null && original > template.price_inr && (
        <span className="text-[11.5px] font-semibold whitespace-nowrap text-subtle">
          M.R.P. <s className="tabular-nums">{formatInr(original)}</s>
        </span>
      )}
    </span>
  );
}
