import { type KeyboardEvent, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/api';
import { CATEGORIES } from './categories';

interface CategoryChipsProps {
  value: string | null;
  onChange: (slug: string | null) => void;
  counts?: Category[];
}

/**
 * Single-select category filter, built as an ARIA radio group: one tab stop, arrow keys
 * move between chips, the selected chip looks "pressed".
 */
export function CategoryChips({ value, onChange, counts }: CategoryChipsProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const total = counts?.reduce((sum, category) => sum + category.count, 0);
  const options = [
    { slug: null, name: 'All', color: null, count: total },
    ...CATEGORIES.map((category) => ({
      ...category,
      count: counts?.find((c) => c.slug === category.slug)?.count,
    })),
  ];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = options.findIndex((option) => option.slug === value);
    const last = options.length - 1;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === 'ArrowRight' || event.key === 'ArrowDown'
            ? (current + 1) % options.length
            : (current - 1 + options.length) % options.length;
    onChange(options[next]!.slug);
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Filter by category"
      onKeyDown={onKeyDown}
      className="-mx-4 flex gap-3 overflow-x-auto px-4 py-2 [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-24px),transparent)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0.5 sm:[mask-image:none]"
    >
      {options.map((option) => {
        const checked = option.slug === value;
        return (
          <button
            key={option.slug ?? 'all'}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.slug)}
            className={cn(
              'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-semibold whitespace-nowrap transition active:scale-[0.96]',
              checked
                ? 'soft-pressed text-primary-text'
                : 'soft-raised-sm text-muted-foreground hover:text-primary-text',
            )}
          >
            {option.color && (
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: option.color }}
                aria-hidden="true"
              />
            )}
            {option.name}
            {typeof option.count === 'number' && (
              <span
                className={cn(
                  'text-[12px] font-bold tabular-nums',
                  checked ? 'opacity-75' : 'text-subtle',
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
