import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/lib/use-online-status';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="soft-raised animate-slide-up mt-4 flex items-center gap-3 rounded-[18px] px-4 py-3 text-[13.8px]"
    >
      <WifiOff className="size-5 shrink-0 text-rose" aria-hidden="true" />
      <span>
        <b>You're offline.</b>{' '}
        <span className="text-muted-foreground">
          Showing what's already loaded; changes will need a connection.
        </span>
      </span>
    </div>
  );
}
