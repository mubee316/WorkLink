import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, X, Plus, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/useAuth';
import { db } from '../firebase';
import api from '../lib/api';

/* ─── Data ─────────────────────────────────────────────────────────── */
const TRADES = [
  { id: 'plumbing',    label: 'Plumbing',          emoji: '🔧' },
  { id: 'electrical',  label: 'Electrical',         emoji: '⚡' },
  { id: 'carpentry',   label: 'Carpentry',          emoji: '🪚' },
  { id: 'painting',    label: 'Painting',           emoji: '🎨' },
  { id: 'ac_repair',   label: 'AC / Cooling',       emoji: '❄️' },
  { id: 'welding',     label: 'Welding',            emoji: '🔥' },
  { id: 'tiling',      label: 'Tiling',             emoji: '🧱' },
  { id: 'cleaning',    label: 'Cleaning',           emoji: '🧹' },
  { id: 'catering',    label: 'Catering',           emoji: '🍳' },
  { id: 'auto_repair', label: 'Auto Repair',        emoji: '🚗' },
  { id: 'masonry',     label: 'Masonry',            emoji: '🏗️' },
  { id: 'generator',   label: 'Generator / Solar',  emoji: '⚙️' },
  { id: 'security',    label: 'Security',           emoji: '🛡️' },
  { id: 'tailoring',   label: 'Tailoring',          emoji: '🧵' },
  { id: 'landscaping', label: 'Landscaping',        emoji: '🌿' },
  { id: 'other',       label: 'Other',              emoji: '🛠️' },
];

const SKILL_SUGGESTIONS = {
  plumbing:    ['Pipe installation', 'Leak repair', 'Drainage', 'Water heater', 'Bathroom fitting'],
  electrical:  ['Wiring', 'Panel upgrade', 'Lighting', 'Socket installation', 'Generator wiring'],
  carpentry:   ['Furniture making', 'Door installation', 'Roofing', 'Flooring', 'Cabinet making'],
  painting:    ['Interior painting', 'Exterior painting', 'Texture / POP', 'Waterproofing'],
  ac_repair:   ['AC installation', 'AC servicing', 'Refrigerator repair', 'Inverter repair'],
  welding:     ['Metal fabrication', 'Gate construction', 'Burglary proof', 'Structural steel'],
  tiling:      ['Floor tiling', 'Wall tiling', 'Marble installation', 'Grout work'],
  cleaning:    ['House cleaning', 'Office cleaning', 'Post-construction', 'Carpet cleaning'],
  catering:    ['Event catering', 'Home cooking', 'Meal prep', 'Baking & Pastry'],
  auto_repair: ['Engine repair', 'Brake service', 'Oil change', 'Auto electrical', 'Body work'],
  masonry:     ['Block laying', 'Concrete work', 'Foundation work', 'Rendering'],
  generator:   ['Generator servicing', 'Generator repair', 'Inverter setup', 'Solar panels'],
  security:    ['CCTV installation', 'Security systems', 'Access control'],
  tailoring:   ['Clothing design', 'Alterations', 'Fashion design', 'Embroidery'],
  landscaping: ['Garden design', 'Lawn mowing', 'Tree trimming', 'Irrigation'],
  other:       [],
};

const AREAS = [
  'Lagos Island', 'Lagos Mainland', 'Victoria Island', 'Lekki', 'Ikoyi',
  'Ikeja', 'Surulere', 'Yaba', 'Alimosho', 'Oshodi', 'Mushin', 'Ajegunle',
  'Badagry', 'Epe', 'Ikorodu', 'Abuja FCT', 'Wuse', 'Garki', 'Maitama',
  'Asokoro', 'Gwarinpa', 'Kano', 'Kaduna', 'Port Harcourt', 'Enugu',
  'Ibadan', 'Benin City', 'Onitsha', 'Nnewi', 'Aba', 'Uyo', 'Warri',
  'Calabar', 'Jos', 'Maiduguri', 'Sokoto', 'Ilorin', 'Abeokuta', 'Akure',
];

const EXPERIENCE_OPTIONS = [
  { value: 'Less than 1 year',  label: 'Less than 1 year' },
  { value: '1–2 years',         label: '1–2 years' },
  { value: '3–5 years',         label: '3–5 years' },
  { value: '5–10 years',        label: '5–10 years' },
  { value: '10+ years',         label: '10+ years' },
];

/* ─── Helpers ───────────────────────────────────────────────────────── */
function WorkLinkMark() {
  return <img src="/logo.png" alt="WorkLink" className="h-15 w-auto" />;
}

function StepDot({ n, current }) {
  const done    = n < current;
  const active  = n === current;
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition
        ${done   ? 'bg-white text-[var(--color-brand-700)]' :
          active ? 'bg-white/30 text-white ring-2 ring-white/60' :
                   'bg-white/10 text-white/40'}`}
      >
        {done ? <CheckCircle className="h-4 w-4" /> : n}
      </div>
    </div>
  );
}

/* ─── Step 1: Trade & Skills ────────────────────────────────────────── */
function StepTradeSkills({ trade, setTrade, skills, setSkills }) {
  const [skillInput, setSkillInput] = useState('');

  const suggestions = (SKILL_SUGGESTIONS[trade] || []).filter((s) => !skills.includes(s));

  function addSkill(s) {
    const trimmed = s.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills((p) => [...p, trimmed]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
      setSkillInput('');
    }
  }

  return (
    <div className="space-y-6">
      {/* Trade picker */}
      <div>
        <label className="mb-3 block text-[13px] font-semibold text-[var(--color-text-body)]">
          What is your primary trade?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TRADES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTrade(t.id); setSkills([]); }}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition
                ${trade === t.id
                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] ring-2 ring-[rgba(55,166,83,0.18)]'
                  : 'border-[var(--color-border-subtle)] bg-white hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]'
                }`}
            >
              <span className="text-[1.3rem] leading-none">{t.emoji}</span>
              <span className={`text-[10px] font-semibold leading-tight
                ${trade === t.id ? 'text-[var(--color-brand-700)]' : 'text-[var(--color-text-muted)]'}`}
              >
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
          Your specific skills
          <span className="ml-1.5 text-[12px] font-normal text-[var(--color-text-muted)]">(add at least one)</span>
        </label>

        {/* Selected skill pills */}
        {skills.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-brand-700)]">
                {s}
                <button type="button" onClick={() => setSkills((p) => p.filter((x) => x !== s))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Suggested pills */}
        {suggestions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addSkill(s)}
                className="flex items-center gap-1 rounded-full border border-dashed border-[var(--color-border-subtle)] px-2.5 py-1 text-[12px] text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-400)] hover:text-[var(--color-brand-600)]"
              >
                <Plus className="h-3 w-3" />
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Custom input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Enter"
            className="flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 text-[14px] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
          />
          <button
            type="button"
            onClick={() => { addSkill(skillInput); setSkillInput(''); }}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-500)]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2: Rates & Experience ────────────────────────────────────── */
function StepRates({ hourlyRate, setHourlyRate, experience, setExperience }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
          Your hourly rate (₦)
        </label>
        <div className="flex items-center overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-white focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
          <span className="border-r border-[var(--color-border-subtle)] px-3 py-2.5 text-[14px] font-semibold text-[var(--color-text-muted)]">₦</span>
          <input
            type="number"
            min="0"
            step="500"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="e.g. 5000"
            className="flex-1 border-0 bg-transparent px-4 py-2.5 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
          <span className="pr-4 text-[13px] text-[var(--color-text-muted)]">/hr</span>
        </div>
        <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
          You can always update this later. Most artisans charge ₦2,500–₦15,000/hr.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
          Years of experience
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setExperience(opt.value)}
              className={`rounded-xl border px-4 py-3 text-left text-[13px] font-medium transition
                ${experience === opt.value
                  ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                  : 'border-[var(--color-border-subtle)] bg-white text-[var(--color-text-body)] hover:border-[var(--color-brand-300)]'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Location & Bio ────────────────────────────────────────── */
function StepLocationBio({ area, setArea, bio, setBio }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
          Where do you offer services?
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
        >
          <option value="">Select your area…</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
          About you
          <span className="ml-1.5 text-[12px] font-normal text-[var(--color-text-muted)]">(optional)</span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          placeholder="Describe your experience, what you specialise in, your work style, and what sets you apart from others…"
          className="w-full resize-none rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-3 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
        />
        <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">
          A good bio helps customers trust and choose you. {bio.length}/500 characters.
        </p>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
const STEP_META = [
  { n: 1, title: 'Trade & Skills',      subtitle: 'What services do you offer?' },
  { n: 2, title: 'Rates & Experience',  subtitle: 'Set your pricing and background.' },
  { n: 3, title: 'Location & Bio',      subtitle: 'Where you work and who you are.' },
];

export default function WorkerSetupPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1
  const [trade, setTrade] = useState('');
  const [skills, setSkills] = useState([]);

  // Step 2
  const [hourlyRate, setHourlyRate] = useState('');
  const [experience, setExperience] = useState('');

  // Step 3
  const [area, setArea] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Guards
  if (userProfile === undefined) return null;
  if (userProfile === null) { navigate('/login'); return null; }
  if (userProfile.role !== 'worker') { navigate('/dashboard'); return null; }
  if (userProfile.skills?.length > 0 || userProfile.setupComplete) { navigate('/dashboard'); return null; }

  function validateStep() {
    if (step === 1) {
      if (!trade) return 'Please select your primary trade.';
      if (skills.length === 0) return 'Add at least one skill.';
    }
    if (step === 2) {
      if (!hourlyRate || Number(hourlyRate) <= 0) return 'Please enter your hourly rate.';
      if (!experience) return 'Please select your years of experience.';
    }
    if (step === 3) {
      if (!area) return 'Please select your service area.';
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      const tradeLabel = TRADES.find((t) => t.id === trade)?.label || trade;
      const allSkills = [tradeLabel, ...skills.filter((s) => s !== tradeLabel)];

      await api.put('/workers/profile', {
        bio: bio.trim(),
        area,
        hourlyRate: Number(hourlyRate),
        skills: allSkills,
        experience,
      });

      // Mark setup complete in Firestore so the guard doesn't re-show
      await updateDoc(doc(db, 'users', userProfile.uid), { setupComplete: true });

      navigate('/dashboard');
    } catch {
      setError('Failed to save your profile. Please try again.');
      setSaving(false);
    }
  }

  const meta = STEP_META[step - 1];

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] lg:grid lg:h-screen lg:overflow-hidden lg:grid-cols-[minmax(360px,1fr)_minmax(520px,420px)]">

      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#006d2a_0%,#00511f_100%)] px-6 py-8 text-white sm:px-10 lg:flex lg:h-screen lg:sticky lg:top-0 lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="relative z-10 flex items-center">
          <WorkLinkMark />
          <div>
            <div className="text-[1.8rem] font-extrabold tracking-[-0.04em]">WorkLink</div>
            <p className="text-xs font-medium text-white/70 sm:text-sm">Nigeria's Skilled Labour Platform</p>
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-24 h-64 w-64 rotate-[-22deg] rounded-[32px] border border-white/18" />
          <div className="absolute left-16 top-18 h-36 w-36 rotate-[18deg] rounded-[20px] border border-white/20" />
          <div className="absolute -left-10 bottom-24 h-52 w-52 rotate-[22deg] rounded-[24px] border border-white/16" />
          <div className="absolute left-22 bottom-34 h-28 w-28 rotate-[-15deg] rounded-[18px] border border-white/16" />
          <div className="absolute -right-16 top-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(159,210,104,0.22)_0%,rgba(159,210,104,0)_68%)]" />
        </div>

        <div className="relative z-10 mt-24 hidden max-w-md lg:block">
          <p className="max-w-sm text-[2.3rem] font-bold leading-[1.05] tracking-[-0.05em] text-white/96">
            Almost there — set up your profile.
          </p>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/70">
            A complete profile gets 3× more bookings. Tell customers who you are, what you do, and what to expect.
          </p>

          {/* Journey checklist */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              { label: 'Account created',      done: true },
              { label: 'Identity verified',     done: true },
              { label: 'Professional profile',  done: false },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full
                  ${done ? 'bg-white/30' : 'border-2 border-white/40'}`}
                >
                  {done && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <p className={`text-[13px] ${done ? 'text-white/60 line-through' : 'text-white font-semibold'}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <div className="flex min-h-screen items-start justify-center px-4 py-12 sm:px-8 lg:min-h-0 lg:h-screen lg:overflow-y-auto lg:items-start lg:px-10 lg:pt-14">
        <div className="w-full max-w-[400px]">

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-[var(--color-text-muted)]">
                Step {step} of 3
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n) => (
                  <StepDot key={n} n={n} current={step} />
                ))}
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
              <div
                className="h-full rounded-full bg-[var(--color-brand-500)] transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Step heading */}
          <h1 className="text-[2rem] font-bold tracking-[-0.045em] text-[var(--color-text-strong)]">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-body)]">{meta.subtitle}</p>

          {/* Step content */}
          <div className="mt-7">
            {step === 1 && (
              <StepTradeSkills
                trade={trade} setTrade={setTrade}
                skills={skills} setSkills={setSkills}
              />
            )}
            {step === 2 && (
              <StepRates
                hourlyRate={hourlyRate} setHourlyRate={setHourlyRate}
                experience={experience} setExperience={setExperience}
              />
            )}
            {step === 3 && (
              <StepLocationBio
                area={area} setArea={setArea}
                bio={bio} setBio={setBio}
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-4 py-3">
              <p className="text-[13px] text-[var(--color-error)]">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setError(''); setStep((s) => s - 1); }}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] px-5 py-2.5 text-[14px] font-semibold text-[var(--color-text-body)] transition hover:border-[var(--color-border-strong)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-500)] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-500)] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-50"
              >
                {saving ? 'Setting up…' : 'Complete Setup'}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Skip link */}
          <p className="mt-4 text-center text-[12px] text-[var(--color-text-muted)]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="underline underline-offset-2 transition hover:text-[var(--color-text-body)]"
            >
              Skip for now
            </button>
            {' '}— you can always complete this in{' '}
            <span className="font-medium">My Profile</span>
          </p>
        </div>
      </div>
    </div>
  );
}
