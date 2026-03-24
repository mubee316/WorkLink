import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';
import { getCache, setCache } from '../lib/cache';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ACTIVE: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Loader },
  COMPLETED: { label: 'Completed', color: 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

function JobCard({ job }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="cursor-pointer rounded-2xl border border-[var(--color-border-subtle)] bg-white p-5 transition hover:border-[var(--color-border-focus)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-[var(--color-text-strong)] line-clamp-2 flex-1">{job.description}</p>
        <span className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}>
          <Icon className="h-3 w-3" />
          {cfg.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[13px]">
        <div className="text-[var(--color-text-muted)]">
          {job.workerName} · {job.hours} hr{job.hours !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-1 font-bold text-[var(--color-brand-700)]">
          ₦{job.totalAmount?.toLocaleString()}
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>

      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
        {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
      </p>
    </div>
  );
}

export default function MyJobs() {
  const { userProfile } = useAuth();
  const [jobs, setJobs] = useState(() => getCache('jobs/my') ?? []);
  const [loading, setLoading] = useState(!getCache('jobs/my'));
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/jobs/my');
        setCache('jobs/my', data.jobs);
        setJobs(data.jobs);
      } catch {
        setError('Failed to load jobs.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const active = jobs.filter((j) => j.status === 'ACTIVE' || j.status === 'PENDING');
  const past = jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'CANCELLED');

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-5">
        <h1 className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">My Jobs</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {userProfile?.role === 'worker' ? 'Jobs assigned to you' : 'Your booked jobs'}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-white border border-[var(--color-border-subtle)]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-6 py-4">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-semibold text-[var(--color-text-strong)]">No jobs yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {userProfile?.role === 'worker' ? 'Jobs booked by customers will appear here.' : 'Find a worker and make your first booking.'}
            </p>
            {userProfile?.role !== 'worker' && (
              <button
                onClick={() => navigate('/workers')}
                className="mt-4 rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
              >
                Find Workers
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <div>
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Active</p>
                <div className="space-y-3">
                  {active.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">History</p>
                <div className="space-y-3">
                  {past.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
