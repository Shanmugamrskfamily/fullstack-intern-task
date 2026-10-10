import { useId } from 'react';
import { cn } from '@/lib/utils';

const HEART =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

interface BrandMarkProps {
  size?: number;
  variant?: 'soft' | 'solid';
  className?: string;
}

/** Layora mark: the L-shaped layout grid plus the rose "favourite" tile. */
export function BrandMark({ size = 40, variant = 'soft', className }: BrandMarkProps) {
  const id = useId();
  const showHeart = size >= 28;

  if (variant === 'solid') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#4338CA" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="18" fill={`url(#${id})`} />
        <rect x="14" y="14" width="16" height="36" rx="6" fill="#fff" />
        <rect x="14" y="34" width="36" height="16" rx="6" fill="#fff" />
        <rect x="34" y="14" width="16" height="16" rx="6" fill="#FB7185" />
        {showHeart && <path d={HEART} transform="translate(36.96 16.96) scale(.42)" fill="#fff" />}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818CF8" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <rect x="14" y="14" width="16" height="36" rx="6" fill={`url(#${id})`} />
      <rect x="14" y="34" width="36" height="16" rx="6" fill={`url(#${id})`} />
      <rect x="34" y="14" width="16" height="16" rx="6" fill="#F43F5E" />
      {showHeart && <path d={HEART} transform="translate(36.96 16.96) scale(.42)" fill="#fff" />}
    </svg>
  );
}

/** Mark on a soft raised tile, plus the wordmark. */
export function BrandLogo({
  size = 42,
  className,
  compact = false,
}: {
  size?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-foreground', className)}>
      <span
        className="soft-raised-sm grid shrink-0 place-items-center rounded-[13px]"
        style={{ width: size, height: size }}
      >
        <BrandMark size={Math.round(size * 0.92)} />
      </span>
      {!compact && (
        <span
          className="text-[22px] leading-none font-extrabold tracking-[-0.035em]"
          style={{ fontSize: size * 0.53 }}
        >
          layora
        </span>
      )}
    </span>
  );
}
