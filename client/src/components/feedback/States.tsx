import { RefreshCw, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Every empty view explains why it is empty and offers the next step. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'soft-raised mx-auto flex max-w-xl flex-col items-center rounded-[28px] px-6 py-10 text-center',
        className,
      )}
    >
      <div className="soft-raised grid size-[84px] place-items-center rounded-[26px] text-subtle [&_svg]:size-9">
        {icon}
      </div>
      <h2 className="mt-5 text-[19px] font-extrabold tracking-[-0.02em]">{title}</h2>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

/** Errors always state the cause and offer a way forward. */
export function ErrorState({
  title = "Couldn't load this",
  message,
  onRetry,
  retrying,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'soft-raised mx-auto flex max-w-xl flex-col items-center gap-5 rounded-[28px] p-6 text-center sm:flex-row sm:text-left',
        className,
      )}
    >
      <div className="soft-raised grid size-[84px] shrink-0 place-items-center rounded-[26px] text-rose">
        <WifiOff className="size-9" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-[19px] font-extrabold tracking-[-0.02em]">{title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{message}</p>
        {onRetry && (
          <Button
            variant="primary"
            className="mt-4"
            onClick={onRetry}
            loading={retrying}
            loadingText="Retrying…"
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Try again
          </Button>
        )}
      </div>
    </div>
  );
}
