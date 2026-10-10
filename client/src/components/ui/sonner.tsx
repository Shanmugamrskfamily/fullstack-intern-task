import { CircleAlert, CircleCheck, Info, LoaderCircle } from 'lucide-react';
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';
import { useTheme } from '@/features/theme/theme-context';

/**
 * Soft-UI toasts: bottom-right on desktop, above the tab bar on phones. Sonner announces
 * them politely to screen readers and never moves focus.
 */
export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  return (
    <SonnerToaster
      theme={theme}
      position="bottom-right"
      offset={24}
      mobileOffset={{ bottom: 100, left: 16, right: 16 }}
      duration={4000}
      visibleToasts={3}
      gap={12}
      icons={{
        success: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
        error: <CircleAlert className="size-5 text-rose" aria-hidden="true" />,
        info: <Info className="size-5 text-primary-text" aria-hidden="true" />,
        loading: (
          <LoaderCircle className="size-5 animate-spin text-primary-text" aria-hidden="true" />
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'soft-raised-lg flex w-full items-center gap-3.5 rounded-[18px] p-3.5 pl-4 font-sans text-foreground sm:w-[420px]',
          icon: 'grid size-10 shrink-0 place-items-center rounded-xl bg-inset',
          content: 'flex-1 min-w-0',
          title: 'text-[14px] font-bold',
          description: 'mt-0.5 text-[13.5px] leading-snug text-muted-foreground',
          actionButton:
            'soft-raised-sm h-9 shrink-0 rounded-[10px] px-3 text-[13.5px] font-bold text-primary-text transition active:scale-95',
          cancelButton:
            'h-9 shrink-0 rounded-[10px] px-3 text-[13px] font-semibold text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}
