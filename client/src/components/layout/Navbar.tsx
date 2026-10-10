import { Heart, LayoutGrid, LibraryBig } from 'lucide-react';
import { Link, NavLink } from 'react-router';
import { BrandLogo } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { useFavorites } from '@/features/favorites/queries';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-10 items-center gap-2 rounded-[11px] px-4 text-[14.5px] font-semibold transition',
    isActive ? 'soft-raised-sm text-primary-text' : 'text-muted-foreground hover:text-foreground',
  );

export function FavoritesBadge({ className }: { className?: string }) {
  const { data } = useFavorites();
  if (!data?.length) return null;
  return (
    <span
      className={cn(
        'grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[11.5px] font-bold text-white tabular-nums dark:text-[#161B24]',
        className,
      )}
    >
      {data.length}
      <span className="sr-only"> saved</span>
    </span>
  );
}

export function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="soft-raised sticky top-3 z-20 flex h-[64px] items-center justify-between gap-3 rounded-[22px] pr-2.5 pl-3 md:h-[70px] md:pr-3.5 md:pl-4">
      <Link to="/templates" aria-label="Layora, go to templates" className="rounded-[14px]">
        <BrandLogo size={42} />
      </Link>

      <nav aria-label="Primary" className="soft-inset hidden gap-1.5 rounded-2xl p-1.5 md:flex">
        <NavLink to="/templates" className={navLinkClass}>
          <LayoutGrid className="size-[17px]" aria-hidden="true" /> Templates
        </NavLink>
        <NavLink to="/favorites" className={navLinkClass}>
          <Heart className="size-[17px]" aria-hidden="true" /> Favorites
          <FavoritesBadge />
        </NavLink>
        <NavLink to="/library" className={navLinkClass}>
          <LibraryBig className="size-[17px]" aria-hidden="true" /> Library
        </NavLink>
      </nav>

      <div className="flex items-center gap-2.5 md:gap-3">
        <ThemeToggle />
        {isAuthenticated ? (
          <div className="hidden md:block">
            <UserMenu />
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild variant="primary">
              <Link to="/register">Create account</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
