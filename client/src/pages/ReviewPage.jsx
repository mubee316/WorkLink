import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../design';
import api from '../lib/api';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ReviewPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [jobRes, reviewRes] = await Promise.all([
          api.get(`/jobs/${jobId}`),
          api.get(`/reviews/job/${jobId}`),
        ]);
        setJob(jobRes.data.job);
        if (reviewRes.data.review) setAlreadyReviewed(true);
      } catch {
        setError('Could not load job details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return setError('Please select a star rating.');
    setSubmitting(true);
    setError('');
    try {
      await api.post('/reviews', { jobId, rating, comment });
      navigate(`/jobs/${jobId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-4">
        <button
          onClick={() => navigate(`/jobs/${jobId}`)}
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-strong)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Job
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="mx-auto max-w-md space-y-6">
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-white border border-[var(--color-border-subtle)]" />
          ) : alreadyReviewed ? (
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-8 py-12 text-center">
              <div className="text-4xl mb-3">⭐</div>
              <p className="font-bold text-[var(--color-text-strong)]">Already reviewed</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">You've already left a review for this job.</p>
              <button
                onClick={() => navigate(`/jobs/${jobId}`)}
                className="mt-5 text-[13px] font-semibold text-[var(--color-brand-700)] hover:underline"
              >
                Back to job
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-[var(--color-text-strong)]">Leave a Review</h1>
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                  Share your experience with this worker.
                </p>
              </div>

              {/* Worker summary */}
              {job && (
                <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-white p-4">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-sm font-bold text-white">
                    {getInitials(job.workerName)}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--color-text-strong)]">{job.workerName}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">{job.description}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Star rating */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white p-6">
                  <p className="mb-4 text-[13px] font-semibold text-[var(--color-text-body)]">
                    How would you rate this worker?
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHovered(s)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-10 w-10 transition-colors
                            ${s <= (hovered || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200'
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="mt-3 text-center text-[13px] font-semibold text-[var(--color-text-muted)]">
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
                    Comment <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe your experience…"
                    rows={4}
                    className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-3 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] transition focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)] resize-none"
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-4 py-3">
                    <p className="text-sm text-[var(--color-error)]">{error}</p>
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" isLoading={submitting}>
                  Submit Review
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
