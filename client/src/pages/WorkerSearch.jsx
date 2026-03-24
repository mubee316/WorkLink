import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Star, Sparkles } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import api from '../lib/api';
import { getCache, setCache } from '../lib/cache';

const SKILLS = ['Electrician', 'Plumber', 'Carpenter', 'AC Technician', 'Painter', 'Welder', 'Tiler', 'Mason', 'Electronics Repair', 'Interior Decorator'];
const AREAS = [
  'Yaba', 'Ikeja', 'Lekki', 'Surulere', 'Maryland', 'Apapa', 'Victoria Island',
  'Lagos Island', 'Ajah', 'Ikorodu', 'Festac', 'Gbagada', 'Ojodu', 'Isale Eko',
  'Abuja', 'Maitama', 'Garki', 'Wuse', 'Gwarinpa', 'Kubwa',
  'Port Harcourt', 'GRA Port Harcourt', 'Rumuola',
  'Ibadan', 'Bodija', 'UI Ibadan',
  'Kano', 'Kaduna', 'Benin City', 'Warri', 'Enugu', 'Onitsha', 'Aba',
];

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
        />
      ))}
      <span className="ml-1 text-[12px] font-semibold text-[var(--color-text-body)]">{value?.toFixed(1)}</span>
    </div>
  );
}

function WorkerCard({ worker, aiMatch }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/workers/${worker.id}`)}
      className="cursor-pointer rounded-2xl border border-[var(--color-border-subtle)] bg-white p-5 transition hover:border-[var(--color-border-focus)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-sm font-bold text-white">
          {getInitials(worker.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-[var(--color-text-strong)]">{worker.name}</p>
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {aiMatch && worker.matchScore != null && (
                <span className="rounded-full bg-[var(--color-brand-700)] px-2 py-0.5 text-[11px] font-bold text-white">
                  {worker.matchScore}% match
                </span>
              )}
              {worker.isAvailable ? (
                <span className="rounded-full bg-[var(--color-brand-100)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-brand-700)]">
                  Available
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                  Busy
                </span>
              )}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1 text-[13px] text-[var(--color-text-muted)]">
            <MapPin className="h-3.5 w-3.5" />
            {worker.area}
          </div>

          <div className="mt-2">
            <StarRating value={worker.avgRating} />
          </div>
        </div>
      </div>

      {aiMatch && worker.matchReason && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--color-brand-50)] px-3 py-2.5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--color-brand-600)]" />
          <p className="text-[12px] leading-snug text-[var(--color-brand-700)]">{worker.matchReason}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {worker.skills?.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-[var(--color-border-subtle)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-body)]"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-4">
        <span className="text-[13px] text-[var(--color-text-muted)]">
          {worker.totalJobs} jobs completed
        </span>
        <span className="font-bold text-[var(--color-brand-700)]">
          ₦{worker.hourlyRate?.toLocaleString()}<span className="text-[12px] font-normal text-[var(--color-text-muted)]">/hr</span>
        </span>
      </div>
    </div>
  );
}

function AiSkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-100" />
          <div className="h-3 w-1/4 rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-3 h-10 rounded-xl bg-gray-100" />
      <div className="mt-4 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-gray-100" />
        <div className="h-5 w-20 rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 flex justify-between border-t border-gray-100 pt-4">
        <div className="h-4 w-24 rounded bg-gray-100" />
        <div className="h-4 w-16 rounded bg-gray-200" />
      </div>
    </div>
  );
}

// ─── Filter Search ────────────────────────────────────────────────────────────
function FilterSearch() {
  const [skill, setSkill] = useState('');
  const [area, setArea] = useState('');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const cacheKey = `workers/search?skill=${skill}&area=${area}&min=${minRate}&max=${maxRate}`;
  const [workers, setWorkers] = useState(() => getCache(cacheKey) ?? []);
  const [loading, setLoading] = useState(!getCache(cacheKey));
  const [error, setError] = useState('');

  const fetchWorkers = useCallback(async () => {
    if (!getCache(cacheKey)) setLoading(true);
    setError('');
    try {
      const params = {};
      if (skill) params.skill = skill;
      if (area) params.area = area;
      if (minRate) params.minRate = minRate;
      if (maxRate) params.maxRate = maxRate;

      const { data } = await api.get('/workers/search', { params });
      setCache(cacheKey, data.workers);
      setWorkers(data.workers);
    } catch {
      setError('Failed to load workers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cacheKey]);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  return (
    <>
      {/* Search bar row */}
      <div className="flex gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
          <Search className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Search by skill (e.g. Electrician)"
            className="flex-1 bg-transparent text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
          <MapPin className="h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="bg-transparent text-[14px] text-[var(--color-text-strong)] focus:outline-none"
          >
            <option value="">All Areas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-[14px] font-medium transition
            ${showFilters
              ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
              : 'border-[var(--color-border-subtle)] bg-white text-[var(--color-text-body)] hover:border-[var(--color-border-strong)]'
            }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mt-3 flex gap-3 rounded-[10px] border border-[var(--color-border-subtle)] bg-white p-4">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[12px] font-semibold text-[var(--color-text-muted)]">Min Rate (₦/hr)</label>
            <input
              type="number"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              placeholder="0"
              className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-[14px] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[12px] font-semibold text-[var(--color-text-muted)]">Max Rate (₦/hr)</label>
            <input
              type="number"
              value={maxRate}
              onChange={(e) => setMaxRate(e.target.value)}
              placeholder="10000"
              className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-[14px] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-[12px] font-semibold text-[var(--color-text-muted)]">Skill Category</label>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-[14px] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none"
            >
              <option value="">All Skills</option>
              {SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button
            onClick={() => { setSkill(''); setArea(''); setMinRate(''); setMaxRate(''); }}
            className="self-end rounded-lg border border-[var(--color-border-subtle)] px-4 py-2 text-[13px] font-medium text-[var(--color-text-body)] hover:border-[var(--color-border-strong)] transition"
          >
            Clear
          </button>
        </div>
      )}

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-white border border-[var(--color-border-subtle)]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-6 py-4">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold text-[var(--color-text-strong)]">No workers found</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-[13px] text-[var(--color-text-muted)]">
              {workers.length} worker{workers.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} aiMatch={false} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── AI Search ────────────────────────────────────────────────────────────────
function AiSearch() {
  const [query, setQuery] = useState('');
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setWorkers([]);
    setSearched(true);
    try {
      const { data } = await api.post('/workers/ai-search', { query });
      setWorkers(data.workers || []);
    } catch {
      setError('AI search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* AI search bar */}
      <form onSubmit={handleSearch}>
        <div className="flex gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-3 focus-within:border-[var(--color-brand-500)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-[var(--color-brand-600)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. I need an electrician in Yaba, budget around ₦3,000/hr"
              className="flex-1 bg-transparent text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-[10px] bg-[var(--color-brand-500)] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? 'Searching…' : 'Find'}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-[var(--color-brand-600)]" />
            <p className="text-[13px] font-medium text-[var(--color-text-muted)]">Finding the best workers for you…</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <AiSkeletonCard key={i} />)}
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-6 rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-6 py-4">
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && searched && (
        <div className="mt-6">
          {workers.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="text-4xl mb-3">🤖</div>
              <p className="font-semibold text-[var(--color-text-strong)]">No matches found</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">Try rephrasing your request or use filter search</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-brand-600)]" />
                <p className="text-[13px] font-medium text-[var(--color-text-muted)]">
                  Top {workers.length} match{workers.length !== 1 ? 'es' : ''} for your request
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workers.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} aiMatch={true} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state before first search */}
      {!loading && !error && !searched && (
        <div className="mt-10 flex flex-col items-center py-10 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-50)]">
            <Sparkles className="h-6 w-6 text-[var(--color-brand-600)]" />
          </div>
          <p className="font-semibold text-[var(--color-text-strong)]">Describe what you need</p>
          <p className="mt-1 max-w-xs text-sm text-[var(--color-text-muted)]">
            Tell us your job in plain English — skill, location, budget — and AI will find your best matches.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            {[
              'I need a plumber in Ikeja for a burst pipe, budget ₦5,000',
              'Looking for an electrician in Lekki under ₦3,000/hr',
              'Experienced carpenter in Yaba for furniture work',
            ].map((example) => (
              <button
                key={example}
                onClick={() => setQuery(example)}
                className="rounded-xl border border-[var(--color-border-subtle)] bg-white px-4 py-2 text-[13px] text-[var(--color-text-body)] transition hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-700)]"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkerSearch() {
  const [mode, setMode] = useState('filter'); // 'filter' | 'ai'

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-8 py-5">
        <h1 className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">Marketplace</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Browse skilled artisans across Nigeria
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        {/* Mode toggle */}
        <div className="mb-6 flex gap-1 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-1 w-fit">
          <button
            onClick={() => setMode('filter')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
              mode === 'filter'
                ? 'bg-white text-[var(--color-text-strong)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filter Search
          </button>
          <button
            onClick={() => setMode('ai')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
              mode === 'ai'
                ? 'bg-white text-[var(--color-text-strong)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Search
          </button>
        </div>

        {mode === 'filter' ? <FilterSearch /> : <AiSearch />}
      </main>
    </AppLayout>
  );
}
