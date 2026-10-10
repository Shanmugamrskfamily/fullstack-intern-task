import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BrandLoader } from '@/components/brand/BrandLoader';
import { Button } from '@/components/ui/button';
import { http } from '@/lib/http';

const SLOW_AFTER_MS = 2500;
const MAX_ATTEMPTS = 10;
const BACKOFF_MS = [2000, 3000, 5000, 5000, 8000, 8000, 10_000, 10_000, 10_000];

type Phase = 'checking' | 'ok' | 'waking' | 'down';

/**
 * The API runs on a free tier that sleeps when idle, so the first request can take up to
 * ~50 s. If the health check is slow, this explains what is happening and retries with
 * backoff, instead of leaving the page looking broken.
 */
export function ServerWakeBanner() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('checking');
  const [attempt, setAttempt] = useState(1);
  const [run, setRun] = useState(0); // bumping it restarts the check ("Retry now")

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;
    const slowTimer = window.setTimeout(
      () => setPhase((current) => (current === 'checking' ? 'waking' : current)),
      SLOW_AFTER_MS,
    );

    const ping = async (n: number): Promise<void> => {
      try {
        await http.get('/health', { timeout: 65_000 });
        if (cancelled) return;
        window.clearTimeout(slowTimer);
        setPhase('ok');
        // Anything that failed while the server slept gets another go.
        void queryClient.refetchQueries({ predicate: (query) => query.state.status === 'error' });
      } catch {
        if (cancelled) return;
        if (n >= MAX_ATTEMPTS) {
          setPhase('down');
          return;
        }
        setPhase('waking');
        retryTimer = window.setTimeout(
          () => {
            setAttempt(n + 1);
            void ping(n + 1);
          },
          BACKOFF_MS[n - 1] ?? 10_000,
        );
      }
    };

    void ping(1);
    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
      window.clearTimeout(retryTimer);
    };
  }, [run, queryClient]);

  const retryNow = () => {
    setAttempt(1);
    setPhase('waking');
    setRun((value) => value + 1);
  };

  if (phase === 'ok' || phase === 'checking') return null;

  return (
    <div
      role="status"
      className="soft-raised animate-slide-up mt-4 flex flex-col gap-3 rounded-[20px] p-3.5 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex items-center gap-3.5">
        <BrandLoader size={46} label="Waking up the server" />
        <p className="text-[13.8px] leading-snug">
          <b className="block">
            {phase === 'down' ? "The server isn't responding" : 'Waking up the server…'}
          </b>
          <span className="text-muted-foreground">
            {phase === 'down'
              ? 'Please try again in a minute. Your favourites are safe.'
              : 'The API sleeps on a free tier when idle. The first request can take up to 50 seconds.'}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3 sm:ml-auto">
        {phase === 'waking' && (
          <div className="w-40">
            <div className="soft-inset relative h-2 overflow-hidden rounded-full">
              <div className="animate-indeterminate absolute inset-y-0 w-2/5 rounded-full bg-gradient-to-r from-[#818CF8] to-primary" />
            </div>
            <p className="mt-1 text-right text-[11.5px] text-subtle tabular-nums">
              Attempt {attempt} of {MAX_ATTEMPTS}
            </p>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={retryNow}>
          <RefreshCw className="size-4" aria-hidden="true" /> Retry now
        </Button>
      </div>
    </div>
  );
}
