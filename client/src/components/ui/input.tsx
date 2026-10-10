import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cn(
        'h-full w-full min-w-0 bg-transparent text-base font-medium text-foreground outline-none placeholder:font-normal placeholder:text-subtle md:text-[15px]',
        className,
      )}
      {...props}
    />
  );
}

interface InputShellProps extends ComponentProps<'div'> {
  leading?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
  valid?: boolean;
}

/** Inset "well" around an input, with optional icons. Focus and error rings live here. */
export function InputShell({
  leading,
  trailing,
  invalid,
  valid,
  className,
  children,
  ...props
}: InputShellProps) {
  return (
    <div
      data-slot="input-shell"
      className={cn(
        'soft-inset flex h-[52px] items-center gap-2.5 rounded-[15px] px-3.5 text-subtle transition-shadow duration-200',
        'focus-within:shadow-[inset_4px_4px_9px_var(--shadow-dark),inset_-4px_-4px_9px_var(--shadow-light),0_0_0_3px_var(--ring)]',
        invalid &&
          'text-rose-text shadow-[inset_4px_4px_9px_var(--shadow-dark),inset_-4px_-4px_9px_var(--shadow-light),0_0_0_2px_rgb(225_29_72/0.6)]',
        valid &&
          !invalid &&
          'shadow-[inset_4px_4px_9px_var(--shadow-dark),inset_-4px_-4px_9px_var(--shadow-light),0_0_0_2px_rgb(4_120_87/0.45)]',
        className,
      )}
      {...props}
    >
      {leading}
      {children}
      {trailing}
    </div>
  );
}
