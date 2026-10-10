import { Cookie } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS, storage } from '@/lib/storage';
import { cn } from '@/lib/utils';

const SHOW_AFTER_MS = 1200;
const REMEMBER_FOR_MS = 365 * 24 * 60 * 60 * 1000;

const alreadySeen = (): boolean => {
  try {
    const value = JSON.parse(storage.get(STORAGE_KEYS.cookieNotice) ?? 'null') as {
      seenAt?: number;
    } | null;
    return typeof value?.seenAt === 'number' && Date.now() - value.seenAt < REMEMBER_FOR_MS;
  } catch {
    return false;
  }
};

/**
 * A gentle, informational notice: Layora stores only strictly necessary items, so there
 * is nothing to accept or reject. It appears after first paint, never blocks the page,
 * never takes focus, and is remembered for 12 months.
 */
export function CookieNotice() {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'leaving'>('hidden');

  useEffect(() => {
    if (alreadySeen()) return;
    const timer = window.setTimeout(() => setPhase('visible'), SHOW_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    storage.set(STORAGE_KEYS.cookieNotice, JSON.stringify({ seenAt: Date.now() }));
    setPhase('leaving');
    window.setTimeout(() => setPhase('hidden'), 150);
  };

  if (phase === 'hidden') return null;

  return (
    <section
      data-cookie-notice
      aria-label="Cookie notice"
      className={cn(
        'soft-raised-lg fixed z-40 flex gap-3.5 rounded-[22px] p-4 transition-opacity duration-200',
        'inset-x-4 bottom-[calc(96px+env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-6 md:left-6 md:w-[400px]',
        phase === 'leaving' ? 'animate-slide-down' : 'animate-slide-up',
      )}
    >
      <span className="soft-raised-sm grid size-[42px] shrink-0 place-items-center rounded-[14px] text-primary-text">
        <Cookie className="size-[21px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-extrabold tracking-[-0.01em]">We keep it simple</h2>
        <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
          Layora only stores what it needs to keep you signed in and remember your theme. No
          tracking, no ads.
        </p>
        <div className="mt-3 flex items-center gap-1.5">
          <Button variant="primary" size="sm" className="h-11 px-[18px]" onClick={dismiss}>
            Got it
          </Button>
          <Button
            asChild
            variant="link"
            className="h-11 px-2.5 text-[13.5px] font-bold no-underline hover:underline"
          >
            <Link to="/cookies">Cookie policy</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
