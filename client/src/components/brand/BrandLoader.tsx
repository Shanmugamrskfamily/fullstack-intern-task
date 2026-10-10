import { useId } from 'react';
import { cn } from '@/lib/utils';

const HEART =
  'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z';

interface BrandLoaderProps {
  size?: number;
  label?: string;
  className?: string;
}

/**
 * Animated brand loader: the layout tiles build up and the heart beats (1.8 s loop).
 * With reduced motion it becomes a gentle pulse (see globals.css).
 */
export function BrandLoader({ size = 72, label = 'Loading', className }: BrandLoaderProps) {
  const id = useId();
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('soft-raised grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      <svg
        className="brand-loader"
        width={size * 0.86}
        height={size * 0.86}
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#818CF8" />
            <stop offset="1" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <rect className="t1" x="14" y="14" width="16" height="36" rx="6" fill={`url(#${id})`} />
        <rect className="t2" x="14" y="34" width="36" height="16" rx="6" fill={`url(#${id})`} />
        <g className="t3">
          <rect x="34" y="14" width="16" height="16" rx="6" fill="#F43F5E" />
          <path d={HEART} transform="translate(36.96 16.96) scale(.42)" fill="#fff" />
        </g>
      </svg>
    </div>
  );
}

/** Full-area loading state used by lazy routes and protected pages. */
export function PageLoader({ label = 'Loading page' }: { label?: string }) {
  return (
    <div className="grid min-h-[50dvh] place-items-center">
      <BrandLoader label={label} />
    </div>
  );
}
