import { type KeyboardEvent, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { PriceFilter as PriceFilterValue } from '@/types/api';
import { PRICE_OPTIONS } from './use-template-filters';

interface PriceFilterProps {
  value: PriceFilterValue | null;
  onChange: (value: PriceFilterValue | null) => void;
}

/** All · Free · Paid segmented control (ARIA radio group, arrow keys move the selection). */
export function PriceFilter({ value, onChange }: PriceFilterProps) {
  const groupRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const current = PRICE_OPTIONS.findIndex((option) => option.value === value);
    const next = (current + step + PRICE_OPTIONS.length) % PRICE_OPTIONS.length;
    onChange(PRICE_OPTIONS[next]!.value);
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label="Filter by price"
      onKeyDown={onKeyDown}
      className="soft-inset flex h-11 shrink-0 items-center gap-1 rounded-[14px] p-1"
    >
      {PRICE_OPTIONS.map((option) => {
        const checked = option.value === value;
        return (
          <button
            key={option.label}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-9 rounded-[11px] px-3.5 text-[13.5px] font-bold transition active:scale-[0.96]',
              checked
                ? 'soft-raised-sm text-primary-text'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
