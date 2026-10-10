import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { type ComponentProps, type ReactNode, useId, useState } from 'react';
import { Input, InputShell } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  label: string;
  icon: ReactNode;
  error?: string;
  hint?: ReactNode;
  valid?: boolean;
  labelAction?: ReactNode;
  trailing?: ReactNode;
}

/**
 * Labelled input with helper text and an inline error under the field. The error is
 * linked with aria-describedby and announced with role="alert".
 */
export function FormField({
  label,
  icon,
  error,
  hint,
  valid,
  labelAction,
  trailing,
  required,
  className,
  ...props
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required && (
            <span className="ml-0.5 text-rose-text" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {labelAction}
      </div>
      <InputShell leading={icon} trailing={trailing} invalid={Boolean(error)} valid={valid}>
        <Input
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...props}
        />
      </InputShell>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-[12.8px] font-semibold text-rose-text"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : (
        hint && (
          <div id={hintId} className="text-[12.5px] text-subtle">
            {hint}
          </div>
        )
      )}
    </div>
  );
}

/** Password field with a 44 px show/hide toggle. */
export function PasswordField(props: Omit<FormFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  return (
    <FormField
      {...props}
      type={visible ? 'text' : 'password'}
      spellCheck={false}
      autoCapitalize="none"
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="-mr-1.5 grid size-11 shrink-0 place-items-center rounded-xl text-subtle transition hover:text-foreground active:scale-90"
        >
          {visible ? (
            <EyeOff className="size-[18px]" aria-hidden="true" />
          ) : (
            <Eye className="size-[18px]" aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
