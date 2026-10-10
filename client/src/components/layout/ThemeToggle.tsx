import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/features/theme/theme-context';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={cn(
        'soft-raised-sm grid size-11 shrink-0 place-items-center rounded-[14px] text-muted-foreground transition hover:text-foreground active:scale-95 active:soft-pressed',
        className,
      )}
    >
      <span className="relative block size-[19px]">
        <Sun
          aria-hidden="true"
          className={cn(
            'absolute inset-0 size-[19px] transition-all duration-300',
            isDark ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0',
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            'absolute inset-0 size-[19px] transition-all duration-300',
            isDark ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100',
          )}
        />
      </span>
    </button>
  );
}
