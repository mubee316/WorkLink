import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { Button, Input } from '../design';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

function WorkLinkMark() {
  return <img src="/logo.png" alt="WorkLink" className="h-15 w-auto" />;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      setServerError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] lg:grid lg:h-screen lg:overflow-hidden lg:grid-cols-[minmax(360px,1fr)_minmax(520px,420px)]">
      {/* Left panel — WorkLink branding */}
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#006d2a_0%,#00511f_100%)] px-6 py-8 text-white sm:px-10 lg:flex lg:h-screen lg:sticky lg:top-0 lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="relative z-10 flex items-center">
          <WorkLinkMark />
          <div>
            <div className="text-[1.8rem] font-extrabold tracking-[-0.04em]">WorkLink</div>
            <p className="text-xs font-medium text-white/70 sm:text-sm">
              Nigeria&apos;s Skilled Labour Platform
            </p>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-24 h-64 w-64 rotate-[-22deg] rounded-[32px] border border-white/18" />
          <div className="absolute left-16 top-18 h-36 w-36 rotate-[18deg] rounded-[20px] border border-white/20" />
          <div className="absolute -left-10 bottom-24 h-52 w-52 rotate-[22deg] rounded-[24px] border border-white/16" />
          <div className="absolute left-22 bottom-34 h-28 w-28 rotate-[-15deg] rounded-[18px] border border-white/16" />
          <div className="absolute -right-16 top-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(159,210,104,0.22)_0%,rgba(159,210,104,0)_68%)]" />
        </div>

        <div className="relative z-10 mt-24 hidden max-w-md lg:block">
          <p className="max-w-sm text-[2.3rem] font-bold leading-[1.05] tracking-[-0.05em] text-white/96">
            Welcome back to WorkLink.
          </p>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/70">
            Log in to manage your bookings, chat with artisans, and track payments — all in one
            place.
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex min-h-screen items-start justify-center px-4 py-12 sm:px-8 lg:min-h-0 lg:h-screen lg:overflow-y-auto lg:items-center lg:px-10">
        <div className="w-full max-w-[356px] lg:max-w-[420px]">
          <h1 className="text-[2rem] font-bold tracking-[-0.045em] text-[var(--color-text-strong)] sm:text-[2.25rem]">
            Log in
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-body)]">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-[var(--color-brand-500)] transition hover:text-[var(--color-brand-600)]"
            >
              Sign up
            </Link>
          </p>

          {serverError && (
            <div className="mt-6 rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-4 py-3">
              <p className="text-sm text-[var(--color-error)]">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input
              label="Email Address"
              placeholder="ada@example.com"
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />

            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
                Password
              </label>
              <div className="flex min-h-11 items-center overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-white transition focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  {...register('password')}
                  className="h-full flex-1 border-0 bg-transparent px-4 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-body)] transition hover:bg-[rgba(55,166,83,0.08)] hover:text-[var(--color-brand-600)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-[var(--color-error)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-[13px] font-semibold text-[var(--color-brand-500)] transition hover:text-[var(--color-brand-600)]"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              size="lg"
              icon={ArrowRight}
              iconPosition="right"
            >
              Log in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
