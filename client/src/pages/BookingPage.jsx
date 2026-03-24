import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Clock, ArrowRight } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button, Input } from '../design';
import api from '../lib/api';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function BookingPage() {
  const { workerId } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [loadingWorker, setLoadingWorker] = useState(true);
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/workers/${workerId}`);
        setWorker(data.worker);
      } catch {
        setError('Could not load worker details.');
      } finally {
        setLoadingWorker(false);
      }
    }
    load();
  }, [workerId]);

  const totalAmount = worker ? worker.hourlyRate * hours : 0;
  const commission = totalAmount * 0.12;
  const workerPayout = totalAmount - commission;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) return setError('Please describe the work needed.');
    if (hours < 1) return setError('Minimum 1 hour.');

    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/jobs', {
        workerId,
        description: description.trim(),
        hours: Number(hours),
      });
      navigate(`/jobs/${data.job.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-strong)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="mx-auto max-w-xl space-y-5">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-strong)]">Book a Worker</h1>
            <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
              Describe the job and select how many hours you need.
            </p>
          </div>

          {/* Worker summary card */}
          {!loadingWorker && worker && (
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-white p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-sm font-bold text-white">
                {getInitials(worker.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--color-text-strong)]">{worker.name}</p>
                <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{worker.area}</span>
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{worker.avgRating?.toFixed(1)}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[var(--color-brand-700)]">₦{worker.hourlyRate?.toLocaleString()}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">per hour</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-4 py-3">
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Description */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
                Describe the work needed
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Fix faulty wiring in 2 rooms and install new light switches"
                rows={4}
                className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-3 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)] resize-none"
              />
            </div>

            {/* Hours selector */}
            <div>
              <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
                Number of hours
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHours((h) => Math.max(1, h - 1))}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-white text-lg font-bold text-[var(--color-text-strong)] transition hover:border-[var(--color-border-strong)]"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={hours}
                  onChange={(e) => setHours(Math.max(1, Number(e.target.value)))}
                  className="w-20 rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-3 py-2 text-center text-[15px] font-semibold text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
                />
                <button
                  type="button"
                  onClick={() => setHours((h) => Math.min(24, h + 1))}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-white text-lg font-bold text-[var(--color-text-strong)] transition hover:border-[var(--color-border-strong)]"
                >
                  +
                </button>
                <span className="text-[13px] text-[var(--color-text-muted)]">
                  <Clock className="inline h-3.5 w-3.5 mr-1" />
                  {hours} hr{hours !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Cost breakdown */}
            {worker && (
              <div className="rounded-2xl bg-[var(--color-surface-canvas)] border border-[var(--color-border-subtle)] p-4 space-y-2">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Cost Breakdown</p>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-text-body)]">₦{worker.hourlyRate?.toLocaleString()} × {hours} hr{hours !== 1 ? 's' : ''}</span>
                  <span className="font-medium text-[var(--color-text-strong)]">₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-text-muted)]">Platform fee (12%)</span>
                  <span className="text-[var(--color-text-muted)]">₦{commission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-text-muted)]">Worker receives</span>
                  <span className="text-[var(--color-text-muted)]">₦{workerPayout.toLocaleString()}</span>
                </div>
                <div className="border-t border-[var(--color-border-subtle)] pt-2 flex justify-between">
                  <span className="font-bold text-[var(--color-text-strong)]">Total</span>
                  <span className="font-bold text-[var(--color-brand-700)] text-[16px]">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={submitting}
              icon={ArrowRight}
              iconPosition="right"
              disabled={loadingWorker}
            >
              Confirm Booking
            </Button>
          </form>
        </div>
      </main>
    </AppLayout>
  );
}
