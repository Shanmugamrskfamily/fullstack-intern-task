import { Heart } from 'lucide-react';
import { type MouseEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { cn } from '@/lib/utils';
import type { Template } from '@/types/api';
import { useFavoriteIds, useToggleFavorite } from './queries';

interface FavoriteButtonProps {
  template: Template;
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * Saves or removes a favourite. Guests are sent to sign in with their intent preserved:
 * the template is saved automatically right after they sign in.
 */
export function FavoriteButton({ template, variant = 'icon', className }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const favoriteIds = useFavoriteIds();
  const toggle = useToggleFavorite(template.id);
  const navigate = useNavigate();
  const location = useLocation();
  const [popCount, setPopCount] = useState(0);

  const saved = favoriteIds.has(template.id);
  const label = saved
    ? `Remove ${template.name} from favorites`
    : `Save ${template.name} to favorites`;

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/login?next=${next}&intent=${encodeURIComponent(`favorite:${template.id}`)}`);
      return;
    }
    if (!saved) setPopCount((count) => count + 1);
    toggle.mutate({ template, favorite: !saved });
  };

  if (variant === 'full') {
    return (
      <Button
        variant={saved ? 'rose' : 'primary'}
        size="lg"
        aria-pressed={saved}
        onClick={onClick}
        className={cn('flex-1', className)}
      >
        <Heart
          key={popCount}
          className={cn('size-[18px]', saved && 'fill-current animate-heart-pop')}
          aria-hidden="true"
        />
        {saved ? 'Saved · Remove' : 'Add to favorites'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'grid size-11 place-items-center rounded-[13px] transition-[transform,background-color,box-shadow,color] duration-200 active:scale-90',
        saved
          ? 'bg-[#E11D48] text-white shadow-[0_8px_18px_-6px_rgb(225_29_72/0.75)]'
          : 'bg-white/92 text-slate-500 shadow-[0_4px_12px_rgb(15_23_42/0.18)] hover:text-[#E11D48]',
        className,
      )}
    >
      <Heart
        key={popCount}
        className={cn('size-[19px]', saved && 'fill-current animate-heart-pop')}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    </button>
  );
}
