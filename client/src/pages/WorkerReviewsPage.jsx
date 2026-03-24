import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StarRow({ value, filled }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= Math.round(value)
            ? 'fill-amber-400 text-amber-400'
            : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-3 text-right text-[12px] font-semibold text-[var(--color-text-muted)]">{star}</span>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <div className="flex-1 rounded-full bg-gray-100 h-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-[12px] text-[var(--color-text-muted)]">{count}</span>
    </div>
  );
}

export default function WorkerReviewsPage() {
  const { userProfile } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userProfile?.uid) return;
    api.get(`/reviews/worker/${userProfile.uid}`)
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setError('Failed to load reviews.'))
      .finally(() => setLoading(false));
  }, [userProfile?.uid]);

  // Stats
  const total = reviews.length;
  const avgRating = total > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
    : 0;

  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-5">
        <h1 className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">My Reviews</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">Feedback from customers you've worked with</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">

        {loading ? (
          <div className="space-y-4">
            <div className="h-36 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-white" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-white" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-6 py-4">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        ) : total === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-[var(--color-border-subtle)] bg-white py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Star className="h-6 w-6 text-amber-400" />
            </div>
            <p className="font-semibold text-[var(--color-text-strong)]">No reviews yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Reviews from customers will appear here after completed jobs.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* Summary card */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-2xl border border-[var(--color-border-subtle)] bg-white px-6 py-5">
              {/* Big score */}
              <div className="flex flex-col items-center justify-center sm:border-r border-b sm:border-b-0 border-[var(--color-border-subtle)] pb-4 sm:pb-0 sm:pr-6">
                <p className="text-[3rem] font-bold leading-none tracking-tight text-[var(--color-text-strong)]">
                  {avgRating.toFixed(1)}
                </p>
                <StarRow value={avgRating} />
                <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
                  {total} review{total !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Star breakdown */}
              <div className="flex flex-1 flex-col justify-center gap-1.5">
                {starCounts.map(({ star, count }) => (
                  <RatingBar key={star} star={star} count={count} total={total} />
                ))}
              </div>
            </div>

            {/* Review list */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-white divide-y divide-[var(--color-border-subtle)]">
              {reviews.map((review) => (
                <div key={review.id} className="px-4 sm:px-6 py-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-[12px] font-bold text-[var(--color-brand-700)]">
                      {getInitials(review.customerName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[var(--color-text-strong)]">
                          {review.customerName || 'Customer'}
                        </p>
                        <span className="flex-shrink-0 text-[12px] text-[var(--color-text-muted)]">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${s <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-200'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-[12px] font-semibold text-[var(--color-text-muted)]">
                          {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][review.rating]}
                        </span>
                      </div>

                      {review.comment && (
                        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-body)]">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </main>
    </AppLayout>
  );
}
