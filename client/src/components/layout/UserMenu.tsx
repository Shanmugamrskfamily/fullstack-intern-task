import { ChevronDown, Cookie, Heart, LibraryBig, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/auth-context';
import { cn, initials } from '@/lib/utils';

export function Avatar({ name, className }: { name?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-[34px] shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-[#818CF8] to-[#4F46E5] text-[13px] font-bold text-white',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Account menu. Log out is kept here, separated from primary navigation. */
export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={user ? `Account menu for ${user.name}` : 'Account menu'}
        className="soft-raised-sm flex h-11 items-center gap-2.5 rounded-[14px] py-1 pr-3 pl-1 text-left transition active:scale-[0.98] data-[state=open]:soft-pressed"
      >
        <Avatar name={user?.name} />
        <span className="hidden min-w-0 lg:block">
          {user ? (
            <>
              <span className="block max-w-[150px] truncate text-[13.5px] font-bold">
                {user.name}
              </span>
              <span className="block max-w-[150px] truncate text-[12px] text-subtle">
                {user.email}
              </span>
            </>
          ) : (
            <span className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-32" />
            </span>
          )}
        </span>
        <ChevronDown className="size-4 text-subtle" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          Signed in as
          <span className="mt-0.5 block truncate text-[14px] font-bold text-foreground">
            {user?.email ?? '…'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => navigate('/favorites')}>
          <Heart aria-hidden="true" /> My favorites
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/library')}>
          <LibraryBig aria-hidden="true" /> My library
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate('/cookies')}>
          <Cookie aria-hidden="true" /> Cookie policy
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={logout}>
          <LogOut aria-hidden="true" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
