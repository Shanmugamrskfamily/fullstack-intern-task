import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Check, CircleAlert, Lock, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toApiError } from '@/lib/api-error';
import { safeNextPath } from '@/lib/security';
import { usePageTitle } from '@/lib/use-page-title';
import { useAuth } from './auth-context';
import { FormField, PasswordField } from './FormField';
import { completeFavoriteIntent, parseFavoriteIntent } from './intent';
import { PasswordStrength } from './PasswordStrength';
import { type RegisterFormInput, type RegisterValues, registerSchema } from './schemas';

const FIELDS = ['name', 'email', 'password'] as const;
const okIcon = (
  <Check className="size-[18px] shrink-0 text-success" strokeWidth={2.6} aria-hidden="true" />
);

export default function RegisterPage() {
  usePageTitle('Create account');
  const { register: registerAccount } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const intentId = parseFavoriteIntent(searchParams.get('intent'));
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<RegisterFormInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const { errors, isSubmitting, touchedFields } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' }) ?? '';

  const isValid = (field: (typeof FIELDS)[number]) =>
    Boolean(touchedFields[field] && !errors[field]);

  const onSubmit = async ({ confirmPassword: _confirm, ...payload }: RegisterValues) => {
    setFormError(null);
    try {
      const session = await registerAccount(payload);
      if (intentId) await completeFavoriteIntent(queryClient, intentId);
      toast.success('Account created', {
        description: `Welcome to Layora, ${session.user.name.split(' ')[0]}!`,
      });
      navigate(next, { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      const fieldErrors = apiError.details.filter(
        (d): d is { field: (typeof FIELDS)[number]; message: string } =>
          (FIELDS as readonly string[]).includes(d.field),
      );
      if (fieldErrors.length) {
        fieldErrors.forEach((detail, i) =>
          form.setError(detail.field, { message: detail.message }, { shouldFocus: i === 0 }),
        );
      } else {
        setFormError(
          apiError.status === 429
            ? 'Too many attempts. Please wait a few minutes and try again.'
            : apiError.message,
        );
      }
    }
  };

  return (
    <div className="soft-raised rounded-[30px] p-6 sm:p-9">
      <h1
        id="page-title"
        tabIndex={-1}
        className="text-[28px] font-extrabold tracking-[-0.03em] outline-none"
      >
        Create your account
      </h1>
      <p className="mt-1.5 mb-6 text-[14.5px] text-muted-foreground">
        Start saving the templates you love.
      </p>

      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="grid gap-[18px]">
        <FormField
          label="Full name"
          required
          autoComplete="name"
          maxLength={50}
          placeholder="Your name"
          icon={<UserRound className="size-[18px] shrink-0" aria-hidden="true" />}
          error={errors.name?.message}
          valid={isValid('name')}
          trailing={isValid('name') ? okIcon : undefined}
          {...form.register('name')}
        />
        <FormField
          label="Email"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          placeholder="name@example.com"
          icon={<Mail className="size-[18px] shrink-0" aria-hidden="true" />}
          error={errors.email?.message}
          valid={isValid('email')}
          trailing={isValid('email') ? okIcon : undefined}
          {...form.register('email')}
        />
        <div className="grid gap-2.5">
          <PasswordField
            label="Password"
            required
            autoComplete="new-password"
            maxLength={72}
            placeholder="Create a password"
            icon={<Lock className="size-[18px] shrink-0" aria-hidden="true" />}
            error={errors.password?.message}
            {...form.register('password')}
          />
          <PasswordStrength password={password} />
        </div>
        <PasswordField
          label="Confirm password"
          required
          autoComplete="new-password"
          maxLength={72}
          placeholder="Re-enter your password"
          icon={<Lock className="size-[18px] shrink-0" aria-hidden="true" />}
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl bg-rose-soft px-4 py-3 text-[13.5px] font-semibold text-rose-text"
          >
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-1 w-full"
          loading={isSubmitting}
          loadingText="Creating your account…"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted-foreground">
        Already have an account?{' '}
        <Link
          to={`/login?${searchParams.toString()}`}
          className="font-bold text-primary-text hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
