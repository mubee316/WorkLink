import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, CheckCircle, XCircle, Loader, Search, Plus } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import { getCache, setCache } from '../lib/cache';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ACTIVE:  { label: 'In Progress',     color: 'bg-blue-100 text-blue-700',   icon: Loader },
  COMPLETED: { label: 'Completed',     color: 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled',     color: 'bg-gray-100 text-gray-500',   icon: XCircle },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-5 py-4">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-[1.5rem] font-bold tracking-tight text-[var(--color-text-strong)]">{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  );
}

function JobRow({ job, isWorker }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  const other = isWorker ? job.customerName : job.workerName;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="flex cursor-pointer items-center gap-4 rounded-xl border border-[var(--color-border-subtle)] bg-white px-4 py-3.5 transition hover:border-[var(--color-border-focus)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[var(--color-text-strong)]">{job.description}</p>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">{other}</p>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <span className="font-bold text-[var(--color-brand-700)]">
          ₦{job.totalAmount?.toLocaleString()}
        </span>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
        <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isWorker = userProfile?.role === 'worker';

  const [jobs, setJobs] = useState(() => getCache('jobs/my') ?? []);
  const [loading, setLoading] = useState(!getCache('jobs/my'));

  useEffect(() => {
    api.get('/jobs/my')
      .then(({ data }) => { setCache('jobs/my', data.jobs); setJobs(data.jobs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const pending   = jobs.filter((j) => j.status === 'PENDING');
  const active    = jobs.filter((j) => j.status === 'ACTIVE');
  const completed = jobs.filter((j) => j.status === 'COMPLETED');

  const totalEarned = completed.reduce((s, j) => s + (j.workerPayout || 0), 0);
  const totalSpent  = completed.reduce((s, j) => s + (j.totalAmount  || 0), 0);

  const stats = isWorker
    ? [
        { label: 'Pending Requests', value: pending.length },
        { label: 'Active Jobs',      value: active.length },
        { label: 'Total Earned',     value: `₦${totalEarned.toLocaleString()}`, sub: `${completed.length} job${completed.length !== 1 ? 's' : ''} completed` },
      ]
    : [
        { label: 'Active Jobs',   value: pending.length + active.length },
        { label: 'Completed',     value: completed.length },
        { label: 'Total Spent',   value: `₦${totalSpent.toLocaleString()}` },
      ];

  // ── Job sections ─────────────────────────────────────────────────────────────
  const sections = isWorker
    ? [
        { title: 'Pending Requests', jobs: pending },
        { title: 'Active Jobs',      jobs: active },
      ]
    : [
        { title: 'Active Bookings',  jobs: [...pending, ...active] },
      ];

  const hasActiveJobs = sections.some((s) => s.jobs.length > 0);

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-4">
        <p className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">
          Welcome, {userProfile?.name?.split(' ')[0]} 👋
        </p>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {isWorker ? 'Browse job requests and start earning.' : 'Find skilled workers and get your jobs done.'}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-8">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#006d2a_0%,#18853c_100%)] px-8 py-10 text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-8 -top-8 h-52 w-52 rotate-[22deg] rounded-[28px] border border-white/15" />
            <div className="absolute right-28 top-4 h-32 w-32 rotate-[-15deg] rounded-[20px] border border-white/12" />
            <div className="absolute -right-2 bottom-2 h-40 w-40 rotate-[10deg] rounded-[24px] border border-white/10" />
          </div>
          <p className="relative max-w-md text-[1.6rem] font-bold leading-snug tracking-[-0.03em]">
            {isWorker ? 'Grow your business. Get hired by trusted customers.' : 'Explore, hire, and get work done with ease.'}
          </p>
          <p className="relative mt-2 text-[14px] text-white/70">
            {isWorker ? 'From one artisan to another, welcome onboard.' : 'From one customer to another, welcome onboard.'}
          </p>
          <button
            onClick={() => navigate(isWorker ? '/jobs' : '/workers')}
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-5 py-2.5 text-[14px] font-semibold transition hover:bg-white/25"
          >
            {isWorker ? 'View all job requests' : 'Find workers'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Stats row */}
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Overview</p>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-white" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>
          )}
        </div>

        {/* Job sections */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-[var(--color-border-subtle)] bg-white" />
            ))}
          </div>
        ) : !hasActiveJobs ? (
          <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border-subtle)] bg-white py-14 text-center">
            <div className="text-4xl mb-3">{isWorker ? '📥' : '🔍'}</div>
            <p className="font-semibold text-[var(--color-text-strong)]">
              {isWorker ? 'No job requests yet' : 'No active bookings'}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {isWorker ? 'Customers will book you once your profile is live.' : 'Find a skilled worker to get started.'}
            </p>
            {!isWorker && (
              <button
                onClick={() => navigate('/workers')}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
              >
                <Search className="h-4 w-4" />
                Find Workers
              </button>
            )}
          </div>
        ) : (
          sections.map(({ title, jobs: sectionJobs }) =>
            sectionJobs.length > 0 ? (
              <div key={title}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</p>
                  <button
                    onClick={() => navigate('/jobs')}
                    className="text-[12px] font-semibold text-[var(--color-brand-700)] hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-2">
                  {sectionJobs.slice(0, 3).map((job) => (
                    <JobRow key={job.id} job={job} isWorker={isWorker} />
                  ))}
                </div>
              </div>
            ) : null
          )
        )}

        {/* Worker earnings section */}
        {isWorker && !loading && completed.length > 0 && (
          <div>
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Earnings</p>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white overflow-hidden">
              {/* Summary row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--color-border-subtle)] border-b border-[var(--color-border-subtle)]">
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Total Earned</p>
                  <p className="mt-1 text-[1.1rem] font-bold text-[var(--color-text-strong)]">₦{totalEarned.toLocaleString()}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Commission Paid</p>
                  <p className="mt-1 text-[1.1rem] font-bold text-[var(--color-text-strong)]">
                    ₦{completed.reduce((s, j) => s + (j.commission || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Jobs Done</p>
                  <p className="mt-1 text-[1.1rem] font-bold text-[var(--color-text-strong)]">{completed.length}</p>
                </div>
              </div>

              {/* Per-job rows */}
              {completed.map((job) => {
                const status = job.payoutStatus || 'pending';
                const statusStyle = {
                  completed: 'bg-[var(--color-brand-50)] text-[var(--color-brand-700)]',
                  failed: 'bg-red-50 text-red-600',
                  no_bank_account: 'bg-amber-50 text-amber-700',
                  pending: 'bg-gray-100 text-gray-500',
                }[status] || 'bg-gray-100 text-gray-500';
                const statusLabel = {
                  completed: 'Paid',
                  failed: 'Failed',
                  no_bank_account: 'No bank account',
                  pending: 'Pending',
                }[status] || status;

                return (
                  <div
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="flex cursor-pointer items-center gap-4 border-b border-[var(--color-border-subtle)] px-5 py-4 last:border-b-0 transition hover:bg-[var(--color-surface-canvas)]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--color-text-strong)]">{job.description}</p>
                      {job.payoutReference && (
                        <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">Ref: {job.payoutReference}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3 text-right">
                      <div>
                        <p className="text-[13px] font-bold text-[var(--color-brand-700)]">₦{(job.workerPayout || 0).toLocaleString()}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">−₦{(job.commission || 0).toLocaleString()} fee</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer CTA to find more workers */}
        {!isWorker && !loading && (
          <div
            onClick={() => navigate('/workers')}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-[var(--color-border-strong)] px-6 py-5 transition hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
                <Plus className="h-4 w-4 text-[var(--color-brand-700)]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[var(--color-text-strong)]">Book a new worker</p>
                <p className="text-[12px] text-[var(--color-text-muted)]">Browse skilled artisans across Lagos</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
          </div>
        )}
      </main>
    </AppLayout>
  );
}
