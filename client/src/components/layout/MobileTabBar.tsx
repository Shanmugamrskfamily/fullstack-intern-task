import { Cookie, Heart, LayoutGrid, LibraryBig, LogIn, LogOut, UserRound } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';
import { FavoritesBadge } from './Navbar';

const tabClass = (isActive: boolean) =>
  cn(
    'relative flex w-[72px] flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold transition active:scale-95 min-[400px]:w-[80px]',
    isActive ? 'soft-pressed text-primary-text' : 'text-subtle',
  );

/** Phone navigation: the top-level destinations plus the account, always icon + label. */
export function MobileTabBar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Primary"
      className="soft-raised fixed inset-x-4 bottom-[max(14px,env(safe-area-inset-bottom))] z-30 flex h-[68px] items-center justify-around rounded-[24px] px-2 md:hidden"
    >
      <NavLink to="/templates" className={({ isActive }) => tabClass(isActive)}>
        <LayoutGrid className="size-[21px]" aria-hidden="true" />
        Templates
      </NavLink>
      <NavLink to="/favorites" className={({ isActive }) => tabClass(isActive)}>
        <Heart className="size-[21px]" aria-hidden="true" />
        Favorites
        <FavoritesBadge className="absolute top-1 right-3 h-[18px] min-w-[18px] text-[10.5px]" />
      </NavLink>
      <NavLink to="/library" className={({ isActive }) => tabClass(isActive)}>
        <LibraryBig className="size-[21px]" aria-hidden="true" />
        Library
      </NavLink>
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger className={tabClass(false)} aria-label="Account menu">
            <UserRound className="size-[21px]" aria-hidden="true" />
            Account
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" sideOffset={14}>
            <DropdownMenuLabel>
              Signed in as
              <span className="mt-0.5 block truncate text-[14px] font-bold text-foreground">
                {user?.email ?? '…'}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => navigate('/cookies')}>
              <Cookie aria-hidden="true" /> Cookie policy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger" onSelect={logout}>
              <LogOut aria-hidden="true" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <NavLink to="/login" className={({ isActive }) => tabClass(isActive)}>
          <LogIn className="size-[21px]" aria-hidden="true" />
          Sign in
        </NavLink>
      )}
    </nav>
  );
}
