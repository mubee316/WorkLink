import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../lib/api';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [jobId, setJobId] = useState('');

  useEffect(() => {
    async function verify() {
      const txRef = searchParams.get('txnref') || searchParams.get('transactionreference');
      const amount = searchParams.get('amount');

      if (!txRef) {
        setStatus('failed');
        return;
      }

      try {
        const { data } = await api.post('/payments/verify', { txRef, amount });
        if (data.success) {
          setJobId(data.jobId);
          setStatus('success');
        } else {
          setStatus('failed');
        }
      } catch {
        setStatus('failed');
      }
    }
    verify();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface-canvas)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border-subtle)] bg-white p-8 text-center">
        {status === 'verifying' && (
          <>
            <Loader className="mx-auto h-12 w-12 animate-spin text-[var(--color-brand-500)]" />
            <h2 className="mt-4 text-lg font-bold text-[var(--color-text-strong)]">Verifying payment…</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Please wait while we confirm your transaction.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-[var(--color-brand-500)]" />
            <h2 className="mt-4 text-lg font-bold text-[var(--color-text-strong)]">Payment Successful!</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Your payment is held in escrow. The worker has been notified.
            </p>
            <button
              onClick={() => navigate(jobId ? `/jobs/${jobId}` : '/jobs')}
              className="mt-6 w-full rounded-xl bg-[var(--color-brand-500)] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
            >
              View Job
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-[var(--color-error)]" />
            <h2 className="mt-4 text-lg font-bold text-[var(--color-text-strong)]">Payment Failed</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              We could not verify your payment. Please try again or contact support.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="mt-6 w-full rounded-xl border border-[var(--color-border-subtle)] px-5 py-3 text-[14px] font-semibold text-[var(--color-text-strong)] transition hover:border-[var(--color-border-strong)]"
            >
              Back to Jobs
            </button>
          </>
        )}
      </div>
    </div>
  );
}
