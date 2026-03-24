import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';

function WorkLinkMark() {
  return <img src="/logo.png" alt="WorkLink" className="h-15 w-auto" />;
}

export default function NinVerification() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [nin, setNin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (userProfile === undefined) return null;
  if (userProfile === null) return null;
  if (userProfile.role !== 'worker' || userProfile.ninVerified === true) {
    navigate('/dashboard');
    return null;
  }

  async function handleVerify() {
    if (nin.length !== 11 || loading) return;
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await api.post('/workers/verify-nin', { nin });
      setSuccess(true);
      setTimeout(() => navigate('/worker-setup'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'NIN verification failed. Check your NIN and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] lg:grid lg:h-screen lg:overflow-hidden lg:grid-cols-[minmax(360px,1fr)_minmax(520px,420px)]">

      {/* Left panel — branding */}
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#006d2a_0%,#00511f_100%)] px-6 py-8 text-white sm:px-10 lg:flex lg:h-screen lg:sticky lg:top-0 lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="relative z-10 flex items-center">
          <WorkLinkMark />
          <div>
            <div className="text-[1.8rem] font-extrabold tracking-[-0.04em]">WorkLink</div>
            <p className="text-xs font-medium text-white/70 sm:text-sm">
              Nigeria's Skilled Labour Platform
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
            One last step before you start earning.
          </p>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/70">
            Verifying your NIN helps build trust with customers and ensures
            only qualified artisans appear on WorkLink.
          </p>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              'Your NIN is encrypted and stored securely',
              'Verified workers appear higher in search results',
              'Customers trust verified artisans more',
            ].map((point) => (
              <div key={point} className="flex items-center gap-3">
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
                  <ShieldCheck className="h-3 w-3 text-white" />
                </div>
                <p className="text-[13px] text-white/80">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — NIN form */}
      <div className="flex min-h-screen items-start justify-center px-4 py-12 sm:px-8 lg:min-h-0 lg:h-screen lg:overflow-y-auto lg:items-center lg:px-10">
        <div className="w-full max-w-[356px] lg:max-w-[420px]">

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)]">
            <ShieldCheck className="h-6 w-6 text-[var(--color-brand-600)]" />
          </div>

          <h1 className="mt-6 text-[2rem] font-bold tracking-[-0.045em] text-[var(--color-text-strong)] sm:text-[2.25rem]">
            Verify Your Identity
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-body)]">
            Enter your 11-digit National Identification Number (NIN) to 
            complete your profile and appear in search results.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
                National Identification Number (NIN)
              </label>
              <input
                type="text"
                value={nin}
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                maxLength={11}
                inputMode="numeric"
                placeholder="Enter your 11-digit NIN"
                className="w-full min-h-11 rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
              />
              <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
                {nin.length}/11 digits entered
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-4 py-3">
                <p className="text-sm text-[var(--color-error)]">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-[rgba(55,166,83,0.24)] bg-[rgba(55,166,83,0.08)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--color-brand-700)]">
                  NIN verified! Setting up your profile…
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={nin.length !== 11 || loading}
              className="w-full rounded-xl bg-[var(--color-brand-500)] py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {loading && <Loader className="h-4 w-4 animate-spin" />}
                {loading ? 'Verifying…' : 'Verify NIN'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
