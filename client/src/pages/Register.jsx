import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Check, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/useAuth';
import { Button, Input, Checkbox, PasswordRequirements } from '../design';

// ── Data ──────────────────────────────────────────────────────────────────────
const ALL_SKILLS = [
  'Electrician', 'Plumber', 'Carpenter', 'AC Technician', 'Painter', 'Welder',
  'Tiler', 'Mason', 'Electronics Repair', 'Interior Decorator', 'Generator Repair',
  'Fumigation', 'Home Cleaning', 'Appliance Repair', 'Roofing', 'Bricklayer',
  'POP / False Ceiling', 'Gate Installer', 'Solar Installer', 'CCTV Installer',
  'Landscaping', 'Glazier', 'Security Systems', 'Sewage / Drainage',
];

const AREAS = [
  'Yaba', 'Ikeja', 'Lekki', 'Surulere', 'Maryland', 'Apapa', 'Victoria Island',
  'Lagos Island', 'Ajah', 'Ikorodu', 'Festac', 'Gbagada', 'Ojodu', 'Isale Eko',
  'Abuja', 'Maitama', 'Garki', 'Wuse', 'Gwarinpa', 'Kubwa',
  'Port Harcourt', 'GRA Port Harcourt', 'Rumuola',
  'Ibadan', 'Bodija', 'UI Ibadan',
  'Kano', 'Kaduna', 'Benin City', 'Warri', 'Enugu', 'Onitsha', 'Aba',
];

const EXPERIENCE_OPTIONS = [
  { value: 'less-than-1', label: '< 1 yr' },
  { value: '1-3', label: '1–3 yrs' },
  { value: '3-5', label: '3–5 yrs' },
  { value: '5-10', label: '5–10 yrs' },
  { value: '10+', label: '10+ yrs' },
];

// ── Zod schema for step 1 ─────────────────────────────────────────────────────
const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must contain one lowercase character')
    .regex(/[A-Z]/, 'Must contain one uppercase character')
    .regex(/[0-9]/, 'Must contain one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain one special character'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and privacy policy',
  }),
});

// ── Small helpers ─────────────────────────────────────────────────────────────
function WorkLinkMark() {
  return <img src="/logo.png" alt="WorkLink" className="h-15 w-auto" />;
}

function NigeriaFlag() {
  return (
    <span className="inline-flex h-4 w-6 overflow-hidden rounded-[2px] border border-[#d8d8d8]">
      <span className="h-full w-2 bg-[var(--color-brand-600)]" />
      <span className="h-full w-2 bg-white" />
      <span className="h-full w-2 bg-[var(--color-brand-600)]" />
    </span>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }) {
  const labels = ['Account', 'Skills', 'Location & Rate'];
  return (
    <div className="mb-6 flex items-center gap-0">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold transition-all',
                  done
                    ? 'bg-[var(--color-brand-600)] text-white'
                    : active
                    ? 'bg-[var(--color-brand-600)] text-white ring-4 ring-[rgba(55,166,83,0.2)]'
                    : 'bg-[var(--color-surface-canvas)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : n}
              </div>
              <span
                className={clsx(
                  'mt-1 text-[11px] font-medium',
                  active ? 'text-[var(--color-brand-700)]' : 'text-[var(--color-text-muted)]'
                )}
              >
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={clsx(
                  'mx-1 mb-5 h-px flex-1 transition-all',
                  done ? 'bg-[var(--color-brand-500)]' : 'bg-[var(--color-border-subtle)]'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Area combo box ────────────────────────────────────────────────────────────
function AreaComboBox({ value, onChange, error }) {
  const [inputVal, setInputVal] = useState(value || '');
  const [open, setOpen] = useState(false);

  const filtered = AREAS.filter((a) =>
    a.toLowerCase().includes(inputVal.toLowerCase())
  ).slice(0, 8);

  const exactMatch = AREAS.some(
    (a) => a.toLowerCase() === inputVal.toLowerCase()
  );
  const showCustom = inputVal.trim().length > 0 && !exactMatch;

  const handleSelect = (area) => {
    setInputVal(area);
    onChange(area);
    setOpen(false);
  };

  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
        Service Area
      </label>
      <div className="relative">
        <div className="flex min-h-11 items-center overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-white focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
          <MapPin className="ml-3 h-4 w-4 flex-shrink-0 text-[var(--color-text-muted)]" />
          <input
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search or type your area…"
            className="h-full flex-1 border-0 bg-transparent px-3 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
        </div>

        {open && (filtered.length > 0 || showCustom) && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[12px] border border-[var(--color-border-subtle)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            {filtered.map((area) => (
              <button
                key={area}
                type="button"
                onMouseDown={() => handleSelect(area)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[14px] text-[var(--color-text-strong)] hover:bg-[var(--color-brand-50)]"
              >
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-text-muted)]" />
                {area}
              </button>
            ))}
            {showCustom && (
              <button
                type="button"
                onMouseDown={() => handleSelect(inputVal.trim())}
                className="flex w-full items-center gap-2 border-t border-[var(--color-border-subtle)] px-4 py-2.5 text-left text-[14px] font-medium text-[var(--color-brand-700)] hover:bg-[var(--color-brand-50)]"
              >
                <Check className="h-3.5 w-3.5 flex-shrink-0" />
                Use &ldquo;{inputVal.trim()}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('client');
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);

  // Step 2 state
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [step2Error, setStep2Error] = useState('');

  // Step 3 state
  const [area, setArea] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step3Errors, setStep3Errors] = useState({});

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const password = useWatch({ control, name: 'password', defaultValue: '' });

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // ── Step 1 submit ───────────────────────────────────────────────────────────
  const onStep1Submit = async (data) => {
    setServerError('');
    if (role === 'client') {
      try {
        const fullName = `${data.firstName} ${data.lastName}`;
        const normalizedPhone = data.phoneNumber.replace(/^0+/, '');
        await registerUser(data.email, data.password, fullName, 'client', `+234${normalizedPhone}`);
        navigate('/dashboard');
      } catch (err) {
        setServerError(err.message);
      }
    } else {
      setStep1Data(data);
      setStep(2);
    }
  };

  // ── Step 2 → 3 ──────────────────────────────────────────────────────────────
  const onStep2Next = () => {
    if (selectedSkills.length === 0) {
      setStep2Error('Select at least one skill.');
      return;
    }
    setStep2Error('');
    setStep(3);
  };

  // ── Step 3 → register ───────────────────────────────────────────────────────
  const onStep3Submit = async () => {
    const errs = {};
    if (!area.trim()) errs.area = 'Service area is required.';
    if (!hourlyRate || Number(hourlyRate) < 500)
      errs.hourlyRate = 'Enter a valid hourly rate (min ₦500).';
    if (Object.keys(errs).length > 0) {
      setStep3Errors(errs);
      return;
    }
    setStep3Errors({});
    setSubmitting(true);
    setServerError('');
    try {
      const fullName = `${step1Data.firstName} ${step1Data.lastName}`;
      const normalizedPhone = step1Data.phoneNumber.replace(/^0+/, '');
      await registerUser(
        step1Data.email,
        step1Data.password,
        fullName,
        'worker',
        `+234${normalizedPhone}`,
        {
          skills: selectedSkills,
          yearsOfExperience: experience,
          bio: bio.trim(),
          area: area.trim(),
          hourlyRate: Number(hourlyRate),
        }
      );
      navigate('/verify-nin');
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-canvas)] lg:grid lg:grid-cols-[minmax(360px,1fr)_minmax(520px,420px)]">
      {/* Left panel */}
      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#006d2a_0%,#00511f_100%)] px-6 py-8 text-white sm:px-10 lg:flex lg:h-screen lg:sticky lg:top-0 lg:overflow-hidden lg:flex-col lg:justify-between lg:px-14 lg:py-12">
        <div className="relative z-10 flex items-center">
          <WorkLinkMark />
          <div>
            <div className="text-[1.8rem] font-extrabold tracking-[-0.04em]">WorkLink</div>
            <p className="text-xs font-medium text-white/70 sm:text-sm">
              Nigeria&apos;s Skilled Labour Platform
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-24 h-64 w-64 rotate-[-22deg] rounded-[32px] border border-white/18" />
          <div className="absolute left-16 top-18 h-36 w-36 rotate-[18deg] rounded-[20px] border border-white/20" />
          <div className="absolute -left-10 bottom-24 h-52 w-52 rotate-[22deg] rounded-[24px] border border-white/16" />
          <div className="absolute left-22 bottom-34 h-28 w-28 rotate-[-15deg] rounded-[18px] border border-white/16" />
          <div className="absolute -right-16 top-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(159,210,104,0.22)_0%,rgba(159,210,104,0)_68%)]" />
        </div>

        <div className="relative z-10 mt-24 hidden max-w-md lg:block">
          <p className="max-w-sm text-[2.3rem] font-bold leading-[1.05] tracking-[-0.05em] text-white/96">
            Find trusted artisans or get hired fast.
          </p>
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/70">
            Connect skilled workers across Nigeria with customers who need quality service — with
            transparent pricing and secure escrow payments.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {['Electrician', 'Plumber', 'Carpenter', 'AC Technician', 'Painter', 'Welder'].map(
              (skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80"
                >
                  {skill}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex min-h-screen items-start justify-center px-4 py-8 sm:px-8 lg:min-h-screen lg:overflow-y-auto lg:items-start lg:px-10 lg:pt-10">
        <div className="w-full max-w-[356px] lg:max-w-[420px]">

          {/* Step indicator for workers on steps 2/3 */}
          {role === 'worker' && (
            <StepIndicator current={step} total={3} />
          )}

          {/* ── STEP 1: Account info ── */}
          {step === 1 && (
            <>
              <h1 className="mt-4 text-[2rem] font-bold tracking-[-0.045em] text-[var(--color-text-strong)] sm:text-[2.25rem]">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-[var(--color-text-body)]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[var(--color-brand-500)] transition hover:text-[var(--color-brand-600)]"
                >
                  Log in
                </Link>
              </p>

              {/* Role selector */}
              <div className="mt-6 flex rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setRole('client')}
                  className={clsx(
                    'flex-1 rounded-[8px] py-2.5 text-[13px] font-semibold transition-all',
                    role === 'client'
                      ? 'bg-white text-[var(--color-text-strong)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'
                  )}
                >
                  I need work done
                </button>
                <button
                  type="button"
                  onClick={() => setRole('worker')}
                  className={clsx(
                    'flex-1 rounded-[8px] py-2.5 text-[13px] font-semibold transition-all',
                    role === 'worker'
                      ? 'bg-white text-[var(--color-text-strong)] shadow-sm'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]'
                  )}
                >
                  I offer services
                </button>
              </div>

              {/* Worker step hint */}
              {role === 'worker' && (
                <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-[var(--color-brand-50)] px-3 py-2">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={clsx(
                          'h-1.5 w-6 rounded-full',
                          n === 1 ? 'bg-[var(--color-brand-600)]' : 'bg-[var(--color-brand-200)]'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-[12px] text-[var(--color-brand-700)]">
                    Step 1 of 3 — Basic info
                  </p>
                </div>
              )}

              {serverError && (
                <div className="mt-4 rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-4 py-3">
                  <p className="text-sm text-[var(--color-error)]">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onStep1Submit)} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="First Name"
                    placeholder="Ada"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Okafor"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
                    Phone Number
                  </label>
                  <div className="flex min-h-11 items-center overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-white focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
                    <div className="flex h-full items-center gap-2 border-r border-[var(--color-border-subtle)] px-3 text-sm text-[var(--color-text-body)]">
                      <NigeriaFlag />
                      <span className="font-medium">+234</span>
                    </div>
                    <input
                      placeholder="080 0000 0000"
                      {...register('phoneNumber')}
                      type="tel"
                      className="h-full flex-1 border-0 bg-transparent px-4 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="mt-1.5 text-xs font-medium text-[var(--color-error)]">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                <Input
                  label="Email Address"
                  placeholder="ada@example.com"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                />

                <div>
                  <label className="mb-2 block text-[13px] font-semibold tracking-[-0.01em] text-[var(--color-text-body)]">
                    Password
                  </label>
                  <div className="flex min-h-11 items-center overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-white transition focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum of 8 characters"
                      {...register('password')}
                      className="h-full flex-1 border-0 bg-transparent px-4 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-body)] transition hover:bg-[rgba(55,166,83,0.08)] hover:text-[var(--color-brand-600)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <PasswordRequirements password={password} />
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-medium text-[var(--color-error)]">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Checkbox
                  {...register('agreeToTerms')}
                  label={
                    <span>
                      I have read and agree to the{' '}
                      <a href="#" className="font-semibold text-[var(--color-brand-500)] underline underline-offset-2">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="#" className="font-semibold text-[var(--color-brand-500)] underline underline-offset-2">
                        Privacy Policy
                      </a>
                    </span>
                  }
                  error={errors.agreeToTerms?.message}
                />

                <Button
                  type="submit"
                  fullWidth
                  isLoading={isSubmitting}
                  size="lg"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  {role === 'worker' ? 'Continue' : 'Create Account'}
                </Button>
              </form>
            </>
          )}

          {/* ── STEP 2: Skills & Experience ── */}
          {step === 2 && (
            <>
              <h1 className="mt-6 text-[1.8rem] font-bold tracking-[-0.045em] text-[var(--color-text-strong)]">
                Your skills
              </h1>
              <p className="mt-1.5 text-sm text-[var(--color-text-body)]">
                Select all the services you offer. You can update this later.
              </p>

              {/* Skills grid */}
              <div className="mt-5">
                <label className="mb-2.5 block text-[13px] font-semibold text-[var(--color-text-body)]">
                  What do you offer?{' '}
                  {selectedSkills.length > 0 && (
                    <span className="font-normal text-[var(--color-brand-700)]">
                      ({selectedSkills.length} selected)
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SKILLS.map((skill) => {
                    const selected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={clsx(
                          'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all',
                          selected
                            ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-600)] text-white'
                            : 'border-[var(--color-border-subtle)] bg-white text-[var(--color-text-body)] hover:border-[var(--color-brand-300)] hover:bg-[var(--color-brand-50)]'
                        )}
                      >
                        {selected && <Check className="h-3 w-3 flex-shrink-0" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
                {step2Error && (
                  <p className="mt-2 text-xs font-medium text-[var(--color-error)]">{step2Error}</p>
                )}
              </div>

              {/* Years of experience */}
              <div className="mt-5">
                <label className="mb-2.5 block text-[13px] font-semibold text-[var(--color-text-body)]">
                  Years of experience <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExperience(opt.value === experience ? '' : opt.value)}
                      className={clsx(
                        'rounded-full border px-4 py-1.5 text-[13px] font-medium transition-all',
                        experience === opt.value
                          ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)] text-[var(--color-brand-700)]'
                          : 'border-[var(--color-border-subtle)] bg-white text-[var(--color-text-body)] hover:border-[var(--color-brand-300)]'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-5">
                <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
                  Short bio <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Experienced electrician with 5 years working on residential and commercial projects across Lagos. I prioritize safety and clean finishes."
                  rows={3}
                  maxLength={300}
                  className="w-full resize-none rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
                />
                <p className="mt-1 text-right text-[11px] text-[var(--color-text-muted)]">
                  {bio.length}/300
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  icon={ArrowLeft}
                  iconPosition="left"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  fullWidth
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={onStep2Next}
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* ── STEP 3: Location & Rate ── */}
          {step === 3 && (
            <>
              <h1 className="mt-6 text-[1.8rem] font-bold tracking-[-0.045em] text-[var(--color-text-strong)]">
                Location & rate
              </h1>
              <p className="mt-1.5 text-sm text-[var(--color-text-body)]">
                Help customers find you and understand your pricing.
              </p>

              {serverError && (
                <div className="mt-4 rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-4 py-3">
                  <p className="text-sm text-[var(--color-error)]">{serverError}</p>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <AreaComboBox
                  value={area}
                  onChange={setArea}
                  error={step3Errors.area}
                />

                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[var(--color-text-body)]">
                    Hourly Rate (₦)
                  </label>
                  <div className="flex min-h-11 items-center overflow-hidden rounded-[10px] border border-[var(--color-border-subtle)] bg-white focus-within:border-[var(--color-border-focus)] focus-within:ring-4 focus-within:ring-[rgba(55,166,83,0.12)]">
                    <span className="border-r border-[var(--color-border-subtle)] px-3 text-[15px] font-semibold text-[var(--color-text-body)]">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="e.g. 5000"
                      min={500}
                      className="h-full flex-1 border-0 bg-transparent px-4 text-[15px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
                    />
                    <span className="mr-4 text-[13px] text-[var(--color-text-muted)]">/hr</span>
                  </div>
                  {step3Errors.hourlyRate ? (
                    <p className="mt-1.5 text-xs font-medium text-[var(--color-error)]">
                      {step3Errors.hourlyRate}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                      Tip: Most artisans in Lagos charge ₦3,000 – ₦10,000/hr depending on skill.
                    </p>
                  )}
                </div>

                {/* Skills summary */}
                <div className="rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-3">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Your selected skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-[var(--color-brand-100)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-brand-700)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  icon={ArrowLeft}
                  iconPosition="left"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  fullWidth
                  isLoading={submitting}
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={onStep3Submit}
                >
                  Create Account
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
