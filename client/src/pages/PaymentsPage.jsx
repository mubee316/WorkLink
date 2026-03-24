import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';

const STATUS_CONFIG = {
  paid: {
    label: 'Paid',
    style: 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    style: 'bg-amber-50 text-amber-700',
    icon: Clock,
  },
  failed: {
    label: 'Failed',
    style: 'bg-red-50 text-red-600',
    icon: XCircle,
  },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatAmount(kobo) {
  if (!kobo) return '₦0';
  return `₦${(kobo / 100).toLocaleString('en-NG')}`;
}

export default function PaymentsPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Workers don't have a payments page
  useEffect(() => {
    if (userProfile && userProfile.role === 'worker') {
      navigate('/dashboard', { replace: true });
    }
  }, [userProfile, navigate]);

  useEffect(() => {
    api.get('/payments/my')
      .then(({ data }) => setPayments(data.payments))
      .catch(() => setError('Failed to load payments.'))
      .finally(() => setLoading(false));
  }, []);

  const totalSpent = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const paidCount = payments.filter((p) => p.status === 'paid').length;

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-5">
        <h1 className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">Payments</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">Your transaction history</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">

        {/* Summary cards */}
        {!loading && !error && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Total Spent</p>
              <p className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--color-text-strong)]">
                {formatAmount(totalSpent)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Transactions</p>
              <p className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--color-text-strong)]">{paidCount}</p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Avg. Per Job</p>
              <p className="mt-1 text-[1.4rem] font-bold tracking-tight text-[var(--color-text-strong)]">
                {paidCount > 0 ? formatAmount(Math.round(totalSpent / paidCount)) : '₦0'}
              </p>
            </div>
          </div>
        )}

        {/* Transactions list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-6 py-4">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border-subtle)] bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-50)]">
              <CreditCard className="h-6 w-6 text-[var(--color-brand-600)]" />
            </div>
            <p className="font-semibold text-[var(--color-text-strong)]">No transactions yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Your payment history will appear here once you book a worker.</p>
            <button
              onClick={() => navigate('/workers')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
            >
              Find Workers
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-white">
            {/* Desktop table header — hidden on mobile */}
            <div className="hidden sm:grid grid-cols-[1fr_140px_120px_100px_40px] gap-4 border-b border-[var(--color-border-subtle)] px-6 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Job</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Date</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Amount</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Status</p>
              <div />
            </div>

            {payments.map((payment) => {
              const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              return (
                <div key={payment.id}>
                  {/* Desktop row — hidden on mobile */}
                  <div
                    onClick={() => payment.jobId && navigate(`/jobs/${payment.jobId}`)}
                    className="hidden sm:grid grid-cols-[1fr_140px_120px_100px_40px] cursor-pointer items-center gap-4 border-b border-[var(--color-border-subtle)] px-6 py-4 last:border-b-0 transition hover:bg-[var(--color-surface-canvas)]"
                  >
                    {/* Job info */}
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[var(--color-text-strong)]">
                        {payment.jobDescription || 'Job'}
                      </p>
                      {payment.workerName && (
                        <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">{payment.workerName}</p>
                      )}
                      <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">Ref: {payment.txnRef}</p>
                    </div>
                    {/* Date */}
                    <p className="text-[13px] text-[var(--color-text-body)]">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </p>
                    {/* Amount */}
                    <p className="text-[13px] font-bold text-[var(--color-text-strong)]">
                      {formatAmount(payment.amount)}
                    </p>
                    {/* Status */}
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.style}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                    {/* Arrow */}
                    <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>

                  {/* Mobile card — hidden on sm+ */}
                  <div
                    onClick={() => payment.jobId && navigate(`/jobs/${payment.jobId}`)}
                    className="sm:hidden cursor-pointer border-b border-[var(--color-border-subtle)] px-4 py-4 last:border-b-0 transition hover:bg-[var(--color-surface-canvas)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex-1 truncate text-[13px] font-semibold text-[var(--color-text-strong)]">
                        {payment.jobDescription || 'Job'}
                      </p>
                      <span className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.style}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>
                    {payment.workerName && (
                      <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{payment.workerName}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[13px] font-bold text-[var(--color-text-strong)]">
                        {formatAmount(payment.amount)}
                      </p>
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
