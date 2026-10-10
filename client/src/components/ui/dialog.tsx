import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  showClose = true,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { showClose?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-scrim backdrop-blur-[4px] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          'soft-raised-lg fixed z-[70] max-h-[calc(100dvh-24px)] overflow-y-auto outline-none',
          // Mobile: bottom sheet. Desktop: centred card.
          'inset-x-0 bottom-0 rounded-t-[28px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-6',
          'sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100vw-48px)] sm:max-w-[1010px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[30px] sm:p-6 sm:data-[state=open]:zoom-in-[0.96] sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:zoom-out-[0.97] sm:data-[state=closed]:slide-out-to-bottom-0',
          'duration-200 data-[state=closed]:duration-150',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            aria-label="Close"
            className="soft-raised-sm absolute top-4 right-4 grid size-11 place-items-center rounded-[14px] text-muted-foreground transition hover:text-foreground active:scale-95 sm:top-6 sm:right-6"
          >
            <X className="size-[18px]" aria-hidden="true" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'text-[26px] leading-tight font-extrabold tracking-[-0.03em] sm:text-[31px]',
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-[15px] leading-relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}
