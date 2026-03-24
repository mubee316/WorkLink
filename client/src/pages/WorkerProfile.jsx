import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Briefcase, Clock, MessageSquare, Sparkles, X, CalendarDays, Wallet } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../design';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function StarRating({ value, size = 'sm' }) {
  const sz = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${s <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold text-[var(--color-brand-700)]">
            {getInitials(review.customerName || 'A')}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-text-strong)]">
              {review.customerName || 'Anonymous'}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </p>
          </div>
        </div>
        <StarRating value={review.rating} />
      </div>
      {review.comment && (
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--color-text-body)]">
          {review.comment}
        </p>
      )}
    </div>
  );
}

function AiBookModal({ worker, onClose, onDone }) {
  const [jobDescription, setJobDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim() || !budget) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/conversations/ai-book', {
        workerId: worker.id,
        jobDescription: jobDescription.trim(),
        preferredDate,
        budget: Number(budget),
      });
      onDone(data.conversation.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start AI booking.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
              <Sparkles className="h-4 w-4 text-[var(--color-brand-700)]" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[var(--color-text-strong)]">AI Booking</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">WorkLink AI will negotiate & book for you</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-canvas)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Worker chip */}
        <div className="mx-6 mt-4 flex items-center gap-3 rounded-xl bg-[var(--color-surface-canvas)] px-4 py-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-bold text-white">
            {getInitials(worker.name)}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-text-strong)]">{worker.name}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">₦{worker.hourlyRate?.toLocaleString()}/hr · {worker.area}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-body)]">
              What do you need done?
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="e.g. Fix a leaking pipe under my kitchen sink, replace the faucet, and check the pressure valves."
              rows={3}
              required
              className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-text-body)]">
                <CalendarDays className="h-3.5 w-3.5" /> Preferred Date
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-3 py-2.5 text-[14px] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-text-body)]">
                <Wallet className="h-3.5 w-3.5" /> Your Budget (₦)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 20000"
                required
                min={1000}
                className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-3 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-[rgba(209,77,77,0.08)] px-4 py-2.5 text-[13px] text-[var(--color-error)]">{error}</p>
          )}

          <div className="flex gap-2 pb-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              fullWidth
              isLoading={loading}
              icon={Sparkles}
            >
              Start AI Booking
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [worker, setWorker] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await api.get(`/workers/${id}`);
        setWorker(data.worker);
        setReviews(data.reviews);
      } catch {
        setError('Could not load worker profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  return (
    <AppLayout>
      {/* Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-strong)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to search
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-48 animate-pulse rounded-2xl bg-white border border-[var(--color-border-subtle)]" />
            <div className="h-32 animate-pulse rounded-2xl bg-white border border-[var(--color-border-subtle)]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-6 py-4">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        ) : worker && (
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Profile card */}
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white p-6">
              <div className="flex items-start gap-5">
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xl font-bold text-white">
                  {getInitials(worker.name)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-[var(--color-text-strong)]">{worker.name}</h1>
                    {worker.isAvailable ? (
                      <span className="rounded-full bg-[var(--color-brand-100)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-brand-700)]">
                        Available
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                        Busy
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-[13px] text-[var(--color-text-muted)]">
                    <MapPin className="h-3.5 w-3.5" />
                    {worker.area}
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <StarRating value={worker.avgRating} size="lg" />
                    <span className="text-[13px] font-semibold text-[var(--color-text-body)]">
                      {worker.avgRating ? worker.avgRating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-[13px] text-[var(--color-text-muted)]">
                      ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-[var(--color-surface-canvas)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
                    <Briefcase className="h-4 w-4 text-[var(--color-brand-700)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[var(--color-text-strong)]">{worker.totalJobs ?? 0}</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Jobs completed</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
                    <Clock className="h-4 w-4 text-[var(--color-brand-700)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[var(--color-text-strong)]">
                      ₦{worker.hourlyRate?.toLocaleString()}/hr
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Hourly rate</p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mt-5">
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {worker.skills?.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-brand-50)] px-3 py-1 text-[12px] font-medium text-[var(--color-brand-700)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {worker.bio && (
                <div className="mt-5">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">About</p>
                  <p className="text-[14px] leading-relaxed text-[var(--color-text-body)]">{worker.bio}</p>
                </div>
              )}

              {/* CTA — customers only */}
              {userProfile?.role !== 'worker' && (
                <div className="mt-6 space-y-2">
                  <div className="flex gap-3">
                    <Button
                      fullWidth
                      size="lg"
                      variant="secondary"
                      icon={MessageSquare}
                      isLoading={startingChat}
                      onClick={async () => {
                        setStartingChat(true);
                        try {
                          const { data } = await api.post('/conversations', { workerId: id });
                          navigate(`/chat/${data.conversation.id}`);
                        } catch {
                          setStartingChat(false);
                        }
                      }}
                    >
                      Message
                    </Button>
                    <Button
                      fullWidth
                      size="lg"
                      onClick={() => navigate(`/book/${id}`)}
                    >
                      Book Now
                    </Button>
                  </div>
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] py-2.5 text-[13px] font-semibold text-[var(--color-brand-700)] transition hover:bg-[var(--color-brand-100)]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Let AI Book for Me
                  </button>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <p className="mb-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Reviews ({reviews.length})
              </p>
              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-6 py-10 text-center">
                  <p className="text-sm text-[var(--color-text-muted)]">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {showAiModal && worker && (
        <AiBookModal
          worker={worker}
          onClose={() => setShowAiModal(false)}
          onDone={(conversationId) => navigate(`/chat/${conversationId}`)}
        />
      )}
    </AppLayout>
  );
}
