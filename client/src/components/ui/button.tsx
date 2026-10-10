import { type VariantProps, cva } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-semibold select-none transition-[transform,box-shadow,color,background-color,opacity] duration-200 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-b from-primary-hi to-primary text-primary-foreground shadow-[0_10px_22px_-8px_rgb(79_70_229/0.7),inset_0_1px_0_rgb(255_255_255/0.22)] hover:shadow-[0_14px_28px_-8px_rgb(79_70_229/0.75),inset_0_1px_0_rgb(255_255_255/0.22)] hover:brightness-105',
        soft: 'soft-raised-sm text-foreground hover:text-primary-text active:soft-pressed',
        ghost: 'text-muted-foreground hover:bg-inset/70 hover:text-foreground',
        rose: 'soft-pressed bg-rose-soft text-rose-text hover:brightness-105',
        danger: 'text-rose-text hover:bg-rose-soft',
        link: 'h-auto px-0 text-primary-text underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-9 rounded-xl px-3 text-[13px]',
        md: 'h-11 rounded-[14px] px-[18px] text-[14.5px]',
        lg: 'h-[52px] rounded-2xl px-6 text-[15.5px]',
        icon: 'size-11 rounded-[14px]',
      },
    },
    defaultVariants: { variant: 'soft', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return (
    <Component
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="size-[18px] animate-spin" aria-hidden="true" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Component>
  );
}
