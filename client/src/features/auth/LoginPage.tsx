import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { CircleAlert, Heart, Lock, Mail, Zap } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError, toApiError } from '@/lib/api-error';
import { safeNextPath } from '@/lib/security';
import { usePageTitle } from '@/lib/use-page-title';
import { useAuth } from './auth-context';
import { FormField, PasswordField } from './FormField';
import { completeFavoriteIntent, intentTemplateName, parseFavoriteIntent } from './intent';
import { DEMO_ACCOUNT, type LoginFormInput, type LoginValues, loginSchema } from './schemas';

export default function LoginPage() {
  usePageTitle('Sign in');
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const intentId = parseFavoriteIntent(searchParams.get('intent'));
  const intentName = intentTemplateName(queryClient, intentId);
  const [formError, setFormError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const form = useForm<LoginFormInput, unknown, LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const signIn = async (values: LoginValues) => {
    setFormError(null);
    try {
      const session = await login(values);
      if (intentId) await completeFavoriteIntent(queryClient, intentId);
      else toast.success(`Welcome back, ${session.user.name.split(' ')[0]}`);
      navigate(next, { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 400 && apiError.details.length) {
        for (const detail of apiError.details) {
          if (detail.field === 'email' || detail.field === 'password') {
            form.setError(detail.field, { message: detail.message }, { shouldFocus: true });
          }
        }
      } else {
        setFormError(
          apiError.status === 429
            ? 'Too many attempts. Please wait a few minutes and try again.'
            : apiError.message,
        );
        if (apiError instanceof ApiError && apiError.code === 'INVALID_CREDENTIALS')
          form.setFocus('password');
      }
    }
  };

  const signInAsDemo = async () => {
    form.clearErrors();
    form.setValue('email', DEMO_ACCOUNT.email);
    form.setValue('password', DEMO_ACCOUNT.password);
    setDemoLoading(true);
    await signIn({ ...DEMO_ACCOUNT });
    setDemoLoading(false);
  };

  const busy = isSubmitting || demoLoading;

  return (
    <div className="soft-raised rounded-[30px] p-6 sm:p-9">
      <h1
        id="page-title"
        tabIndex={-1}
        className="text-[28px] font-extrabold tracking-[-0.03em] outline-none"
      >
        Welcome back
      </h1>
      <p className="mt-1.5 mb-6 text-[14.5px] text-muted-foreground">
        Sign in to your Layora account.
      </p>

      {intentId && (
        <p className="soft-pressed mb-6 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[13.5px] text-muted-foreground">
          <Heart className="size-[18px] shrink-0 fill-current text-rose" aria-hidden="true" />
          <span>
            Sign in to save{' '}
            {intentName ? <b className="text-foreground">{intentName}</b> : 'this template'}. We'll
            add it to your favourites right after.
          </span>
        </p>
      )}

      <form noValidate onSubmit={form.handleSubmit(signIn)} className="grid gap-[18px]">
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
          {...form.register('email')}
        />
        <PasswordField
          label="Password"
          required
          autoComplete="current-password"
          maxLength={72}
          placeholder="Your password"
          icon={<Lock className="size-[18px] shrink-0" aria-hidden="true" />}
          error={errors.password?.message}
          {...form.register('password')}
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
          loading={isSubmitting && !demoLoading}
          loadingText="Signing in…"
          disabled={busy}
        >
          Sign in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[12.5px] font-semibold text-subtle before:h-0.5 before:flex-1 before:rounded before:shadow-[inset_1px_1px_2px_var(--shadow-dark),inset_-1px_-1px_2px_var(--shadow-light)] after:h-0.5 after:flex-1 after:rounded after:shadow-[inset_1px_1px_2px_var(--shadow-dark),inset_-1px_-1px_2px_var(--shadow-light)]">
        or
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={() => void signInAsDemo()}
        loading={demoLoading}
        loadingText="Signing in as demo…"
        disabled={busy}
      >
        <Zap className="size-[17px]" aria-hidden="true" /> Continue with demo account
      </Button>

      <p className="mt-6 text-center text-[14px] text-muted-foreground">
        New to Layora?{' '}
        <Link
          to={`/register?${searchParams.toString()}`}
          className="font-bold text-primary-text hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
