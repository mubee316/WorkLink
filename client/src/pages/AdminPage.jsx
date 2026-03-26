import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../design';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [resolving, setResolving] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);

  async function loadDisputes() {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/disputes');
      setDisputes(data.disputes);
    } catch {
      setError('Failed to load disputes.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDisputes(); }, []);

  const handleResolve = async (jobId, resolution) => {
    setResolving(`${jobId}-${resolution}`);
    try {
      await api.patch(`/jobs/${jobId}/dispute/resolve`, { resolution });
      await loadDisputes();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve dispute.');
    } finally {
      setResolving('');
    }
  };

  const open = disputes.filter((d) => d.status === 'open');
  const resolved = disputes.filter((d) => d.status === 'resolved');

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Admin</p>
          <h1 className="text-[18px] font-bold text-[var(--color-text-strong)]">Dispute Management</h1>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-[12px] font-semibold text-red-700">
          <AlertTriangle className="h-3.5 w-3.5" />
          {open.length} open
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="h-6 w-6 animate-spin text-[var(--color-brand-500)]" />
          </div>
        ) : disputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle className="h-10 w-10 text-[var(--color-brand-400)] mb-3" />
            <p className="text-[15px] font-semibold text-[var(--color-text-strong)]">No disputes</p>
            <p className="text-[13px] text-[var(--color-text-muted)] mt-1">All clear — no disputes have been raised.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-8">

            {/* Open disputes */}
            {open.length > 0 && (
              <section className="space-y-3">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Open Disputes</p>
                {open.map((d) => (
                  <DisputeCard
                    key={d.id}
                    dispute={d}
                    isExpanded={expanded === d.id}
                    onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
                    onResolve={handleResolve}
                    resolving={resolving}
                  />
                ))}
              </section>
            )}

            {/* Resolved disputes */}
            {resolved.length > 0 && (
              <section className="space-y-3">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Resolved</p>
                {resolved.map((d) => (
                  <DisputeCard
                    key={d.id}
                    dispute={d}
                    isExpanded={expanded === d.id}
                    onToggle={() => setExpanded(expanded === d.id ? null : d.id)}
                    onResolve={handleResolve}
                    resolving={resolving}
                    readOnly
                  />
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

function DisputeCard({ dispute, isExpanded, onToggle, onResolve, resolving, readOnly }) {
  const isResolved = dispute.status === 'resolved';

  return (
    <div className={`rounded-2xl border bg-white overflow-hidden ${isResolved ? 'border-[var(--color-border-subtle)] opacity-70' : 'border-red-200'}`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${isResolved ? 'bg-gray-100' : 'bg-red-100'}`}>
            {isResolved
              ? <CheckCircle className="h-4 w-4 text-gray-500" />
              : <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-text-strong)]">{dispute.jobDescription}</p>
            <p className="text-[12px] text-[var(--color-text-muted)]">
              {dispute.customerName} vs {dispute.workerName} · #{dispute.id.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isResolved && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${dispute.resolution === 'release' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {dispute.resolution === 'release' ? 'Released' : 'Refunded'}
            </span>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />}
        </div>
      </button>

      {/* Expanded body */}
      {isExpanded && (
        <div className="border-t border-[var(--color-border-subtle)] px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Customer</p>
              <p className="font-medium text-[var(--color-text-strong)]">{dispute.customerName}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Worker</p>
              <p className="font-medium text-[var(--color-text-strong)]">{dispute.workerName}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Reason</p>
              <p className="text-[var(--color-text-body)]">{dispute.reason}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Raised on</p>
              <p className="text-[var(--color-text-body)]">
                {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Description</p>
            <p className="text-[13px] text-[var(--color-text-body)] leading-relaxed">{dispute.description}</p>
          </div>

          {!readOnly && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={!!resolving}
                onClick={() => onResolve(dispute.jobId, 'release')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-600)] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[var(--color-brand-700)] disabled:opacity-50"
              >
                {resolving === `${dispute.jobId}-release`
                  ? <Loader className="h-4 w-4 animate-spin" />
                  : <CheckCircle className="h-4 w-4" />}
                Release to Worker
              </button>
              <button
                type="button"
                disabled={!!resolving}
                onClick={() => onResolve(dispute.jobId, 'refund')}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {resolving === `${dispute.jobId}-refund`
                  ? <Loader className="h-4 w-4 animate-spin" />
                  : <XCircle className="h-4 w-4" />}
                Refund Customer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
