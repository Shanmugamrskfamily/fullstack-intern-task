import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Template } from '@/types/api';
import { isBestseller } from './format';

const badge =
  'flex h-7 items-center gap-1 rounded-full px-2.5 text-[12px] font-extrabold whitespace-nowrap';

/**
 * Deal badges drawn over a thumbnail: "Bestseller" (amber) and the launch-offer discount
 * (rose to orange). Thumbnails are always light, so the colours are fixed in both themes.
 */
export function DealBadges({
  template,
  className,
}: {
  template: Pick<Template, 'favorites_count' | 'discount_percent'>;
  className?: string;
}) {
  const bestseller = isBestseller(template);
  const discount = template.discount_percent;
  if (!bestseller && discount <= 0) return null;

  return (
    <div className={cn('pointer-events-none flex flex-wrap gap-1.5', className)}>
      {bestseller && (
        <span
          className={cn(badge, 'bg-[#FEF3C7] text-[#92400E] shadow-[0_2px_8px_rgb(15_23_42/0.14)]')}
        >
          <Flame className="size-3.5 text-[#EA580C]" aria-hidden="true" /> Bestseller
        </span>
      )}
      {discount > 0 && (
        <span
          className={cn(
            badge,
            'bg-gradient-to-r from-[#E11D48] to-[#F97316] tracking-[0.02em] text-white shadow-[0_6px_14px_-6px_rgb(225_29_72/0.75)]',
          )}
        >
          {discount}% OFF
        </span>
      )}
    </div>
  );
}
