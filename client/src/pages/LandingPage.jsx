import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import {
  ArrowRight, Star, Shield, Zap, MessageCircle, CheckCircle,
  Wrench, Plug, Droplets, Wind, Paintbrush, Hammer,
  Tv, Layers, ChevronRight, FileText, Users, Lock
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { icon: Plug, label: 'Electrician', count: '120+' },
  { icon: Droplets, label: 'Plumber', count: '95+' },
  { icon: Hammer, label: 'Carpenter', count: '80+' },
  { icon: Wind, label: 'AC Technician', count: '60+' },
  { icon: Paintbrush, label: 'Painter', count: '75+' },
  { icon: Wrench, label: 'Welder', count: '45+' },
  { icon: Layers, label: 'Tiler', count: '55+' },
  { icon: Tv, label: 'Electronics Repair', count: '40+' },
];

const MORE_TAGS = [
  'Mason', 'Interior Decorator', 'Generator Repair', 'CCTV Installation',
  'Fumigation', 'Roof Repair', 'Landscaping', 'Gate Installer',
  'Pop Ceiling', 'Glazier', 'Laundry', 'Security Door', 'Solar Installer',
  'Concrete Work', 'Drainage Cleaning', 'Home Cleaning',
];

const STEPS = [
  {
    number: '01',
    icon: FileText,
    label: 'Step one',
    title: 'Describe your job',
    desc: 'Tell us what you need — skill, location, budget. Takes under a minute.',
    detail: 'AI-powered matching',
  },
  {
    number: '02',
    icon: Users,
    label: 'Step two',
    title: 'Pick your worker',
    desc: 'Browse verified artisans with real ratings, reviews, and past jobs.',
    detail: '500+ verified workers',
  },
  {
    number: '03',
    icon: Lock,
    label: 'Step three',
    title: 'Pay securely',
    desc: 'Funds are held in escrow and only released when you\'re satisfied.',
    detail: 'Escrow protected',
  },
];

const WHY = [
  { icon: Shield, title: 'Verified Artisans', desc: 'Every worker is identity-verified before they can take jobs.' },
  { icon: CheckCircle, title: 'Escrow Payments', desc: 'Your money is protected. Workers get paid only on completion.' },
  { icon: MessageCircle, title: 'Real-time Chat', desc: 'Communicate directly with your worker before and during the job.' },
  { icon: Zap, title: 'AI-Powered Matching', desc: 'Describe what you need in plain English — our AI finds the best fit.' },
];

const STATS = [
  { value: '500+', label: 'Verified Workers' },
  { value: '1,200+', label: 'Jobs Completed' },
  { value: '4.8★', label: 'Average Rating' },
];

const TESTIMONIALS = [
  {
    name: 'Amaka O.',
    city: 'Lagos',
    rating: 5,
    text: 'Found a plumber in Yaba within 10 minutes. He showed up on time and fixed everything. WorkLink is a lifesaver.',
  },
  {
    name: 'Emeka T.',
    city: 'Abuja',
    rating: 5,
    text: 'The AI search is unreal. I typed "electrician near me under ₦3k" and got 5 great options instantly.',
  },
  {
    name: 'Fatima B.',
    city: 'Port Harcourt',
    rating: 5,
    text: 'I love the escrow — I didn\'t have to worry about paying upfront and getting ghosted. Very professional platform.',
  },
];

// ─── Floating Worker Cards (Hero right side) ──────────────────────────────────
const PREVIEW_WORKERS = [
  { name: 'Chidi Okafor', skill: 'Electrician', area: 'Yaba, Lagos', rate: '₦2,500', rating: 4.9, jobs: 84 },
  { name: 'Bello Usman', skill: 'Plumber', area: 'Ikeja, Lagos', rate: '₦2,000', rating: 4.7, jobs: 61 },
  { name: 'Ngozi Eze', skill: 'AC Technician', area: 'Lekki, Lagos', rate: '₦3,500', rating: 4.8, jobs: 47 },
];

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function PreviewCard({ worker, style }) {
  return (
    <div
      className="absolute rounded-2xl border border-white/20 bg-white/95 backdrop-blur-sm p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] w-[220px]"
      style={style}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#00511f] text-[11px] font-bold text-white">
          {getInitials(worker.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-gray-900">{worker.name}</p>
          <p className="text-[11px] text-gray-500">{worker.skill} · {worker.area}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-[12px] font-semibold text-gray-700">{worker.rating}</span>
          <span className="text-[11px] text-gray-400">({worker.jobs} jobs)</span>
        </div>
        <span className="text-[12px] font-bold text-[#00511f]">{worker.rate}/hr</span>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        className={`pointer-events-auto transition-all duration-300 ease-in-out
          ${scrolled
            ? 'mt-0 w-full rounded-none border-b border-white/10 bg-white/80 px-8 py-3.5 backdrop-blur-xl shadow-sm'
            : 'mt-4 w-[min(900px,calc(100%-2rem))] rounded-2xl bg-white/90 px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.10)] backdrop-blur-md border border-white/60'
          }`}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="WorkLink" className="h-8 w-auto" />
            <span className="text-[15px] font-bold text-gray-900">WorkLink</span>
          </div>

          {/* Links */}
          <div className="hidden items-center gap-7 md:flex">
            {['How it works', 'Categories', 'Why WorkLink'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-[13px] font-medium text-gray-600 transition hover:text-gray-900"
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="rounded-xl px-4 py-2 text-[13px] font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Log in
            </button>
            <button
              onClick={onRegister}
              className="rounded-xl bg-[#00511f] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#006d2a]"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/dashboard', { replace: true });
  }, [currentUser, navigate]);

  const goRegister = () => navigate('/register');
  const goLogin = () => navigate('/login');

  return (
    <div className="min-h-screen bg-[#f9faf7] font-[Manrope,sans-serif] overflow-x-hidden">
      <Navbar onLogin={goLogin} onRegister={goRegister} />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#f9faf7]">
        {/* Background blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-[#00511f]/6 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -right-40 h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-3xl" />

        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 pb-16 pt-28 md:min-h-screen md:flex-row md:gap-16 md:pb-0 md:pt-0">
          {/* Left */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00511f]/20 bg-[#00511f]/8 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00511f] animate-pulse" />
              <span className="text-[12px] font-semibold text-[#00511f]">Nigeria's Skilled Labour Marketplace</span>
            </div>

            <h1 className="text-[2.8rem] font-black leading-[1.1] tracking-tight text-gray-900 md:text-[3.4rem]">
              Find trusted<br />
              <span className="text-[#00511f]">artisans</span> near<br />
              you, fast.
            </h1>

            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-gray-500 md:text-[16px]">
              Electricians, plumbers, carpenters and more — vetted, rated, and ready to work. Book in minutes, pay securely.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:items-start">
              <button
                onClick={goRegister}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00511f] px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(0,81,31,0.3)] transition hover:bg-[#006d2a] hover:shadow-[0_6px_20px_rgba(0,81,31,0.4)] sm:w-auto"
              >
                Find a Worker <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={goRegister}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-7 py-3.5 text-[14px] font-bold text-gray-700 transition hover:border-gray-300 sm:w-auto"
              >
                Join as Artisan
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-5 md:justify-start">
              <div className="flex -space-x-2">
                {['CO', 'BU', 'NE'].map((i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#00511f] text-[9px] font-bold text-white">
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-gray-500">
                <span className="font-bold text-gray-800">500+ artisans</span> ready to take your job
              </p>
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="relative mt-16 hidden h-[400px] w-[340px] flex-shrink-0 md:block">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#00511f]/8 to-amber-400/8" />
            <PreviewCard worker={PREVIEW_WORKERS[0]} style={{ top: 20, left: 10 }} />
            <PreviewCard worker={PREVIEW_WORKERS[1]} style={{ top: 140, right: 0 }} />
            <PreviewCard worker={PREVIEW_WORKERS[2]} style={{ bottom: 20, left: 20 }} />
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden flex-col items-center gap-1 opacity-40 md:flex">
          <div className="h-8 w-5 rounded-full border-2 border-gray-400 flex items-start justify-center pt-1">
            <div className="h-1.5 w-1 rounded-full bg-gray-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-3 gap-4 text-center sm:gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-[2.2rem] font-black tracking-tight text-[#00511f]">{value}</p>
                <p className="mt-1 text-[13px] font-medium text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-28">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <div className="mb-20 text-center">
            <span className="inline-block rounded-full bg-[#00511f]/8 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-[#00511f]">
              Simple process
            </span>
            <h2 className="mt-4 text-[2.2rem] font-black tracking-tight text-gray-900 md:text-[2.6rem]">
              Three steps to get it done
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-gray-500">
              From request to completion — WorkLink handles everything in between.
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">

            {/* Connecting dashed line (desktop only) */}
            <div className="pointer-events-none absolute left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] top-10 hidden h-[2px] md:block"
              style={{ background: 'repeating-linear-gradient(90deg, #00511f33 0, #00511f33 8px, transparent 8px, transparent 18px)' }}
            />

            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isCenter = i === 1;
              return (
                <div key={step.number} className="flex flex-col items-center text-center">

                  {/* Circle */}
                  <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition
                    ${isCenter
                      ? 'bg-[#00511f] shadow-[0_8px_28px_rgba(0,81,31,0.35)]'
                      : 'bg-white border-2 border-[#00511f]/25 shadow-[0_4px_16px_rgba(0,0,0,0.07)]'
                    }`}
                  >
                    <Icon className={`h-7 w-7 ${isCenter ? 'text-white' : 'text-[#00511f]'}`} />
                    {/* Step number badge */}
                    <span className={`absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black
                      ${isCenter ? 'bg-amber-400 text-gray-900' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {i + 1}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mt-6 max-w-[220px]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#00511f]/50">{step.label}</p>
                    <h3 className="mt-1.5 text-[17px] font-black text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{step.desc}</p>
                    {/* Detail pill */}
                    <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#00511f]/15 bg-[#00511f]/6 px-3 py-1 text-[11px] font-semibold text-[#00511f]">
                      <CheckCircle className="h-3 w-3" />
                      {step.detail}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center">
            <button
              onClick={goRegister}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#00511f] px-7 py-3.5 text-[14px] font-bold text-white shadow-[0_4px_16px_rgba(0,81,31,0.25)] transition hover:bg-[#006d2a]"
            >
              Get started for free <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      <section id="categories" className="bg-[#f9faf7] py-28">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <div className="mb-14 flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:text-left">
            <div>
              <span className="inline-block rounded-full bg-[#00511f]/8 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-[#00511f]">
                What we offer
              </span>
              <h2 className="mt-4 text-[2.2rem] font-black tracking-tight text-gray-900 md:text-[2.6rem]">
                Every skill you need,<br className="hidden md:block" /> in one place
              </h2>
            </div>
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-gray-500 md:mt-0 md:text-right">
              From quick fixes to full renovations — our artisans cover it all.
            </p>
          </div>

          {/* Main category grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map(({ icon: Icon, label, count }) => (
              <button
                key={label}
                onClick={goRegister}
                className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:-translate-y-1 hover:border-[#00511f]/20 hover:shadow-[0_12px_28px_rgba(0,81,31,0.1)]"
              >
                {/* Background watermark number */}
                <span className="pointer-events-none absolute -right-2 -top-3 text-[4rem] font-black leading-none text-[#00511f]/5 select-none">
                  {label[0]}
                </span>
                {/* Icon */}
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00511f]/8 transition group-hover:bg-[#00511f]">
                  <Icon className="h-5 w-5 text-[#00511f] transition group-hover:text-white" />
                </div>
                {/* Text */}
                <div>
                  <p className="text-[14px] font-bold text-gray-900">{label}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-gray-400">{count} workers</p>
                </div>
                {/* Arrow */}
                <ArrowRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-gray-200 transition group-hover:text-[#00511f]" />
              </button>
            ))}
          </div>

          {/* More tags row */}
          <div className="mt-8">
            <p className="mb-4 text-[12px] font-bold uppercase tracking-widest text-gray-400">And so much more...</p>
            <div className="flex flex-wrap gap-2.5">
              {MORE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={goRegister}
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[12px] font-semibold text-gray-600 transition hover:border-[#00511f]/30 hover:bg-[#00511f]/5 hover:text-[#00511f]"
                >
                  {tag}
                </button>
              ))}
              <button
                onClick={goRegister}
                className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-[#00511f]/30 px-4 py-1.5 text-[12px] font-bold text-[#00511f] transition hover:border-[#00511f] hover:bg-[#00511f]/5"
              >
                View all services <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── Why WorkLink ─────────────────────────────────────────────────── */}
      <section id="why-worklink" className="relative overflow-hidden bg-[#00511f] py-28">

        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          {/* Rotated rounded rectangles — same style as register page */}
          <div className="absolute -left-20 top-16 h-72 w-72 rotate-[-22deg] rounded-[40px] bg-white/5" />
          <div className="absolute left-20 top-10 h-40 w-40 rotate-[18deg] rounded-[24px] bg-white/4" />
          <div className="absolute -left-10 bottom-20 h-60 w-60 rotate-[22deg] rounded-[32px] bg-white/3" />
          <div className="absolute left-40 bottom-32 h-28 w-28 rotate-[-15deg] rounded-[18px] bg-white/4" />
          <div className="absolute -right-20 top-24 h-80 w-80 rotate-[12deg] rounded-[40px] bg-white/3" />
          <div className="absolute right-24 top-8 h-44 w-44 rotate-[-20deg] rounded-[28px] bg-white/4" />
          <div className="absolute -right-10 bottom-16 h-64 w-64 rotate-[-18deg] rounded-[36px] bg-white/3" />
          <div className="absolute right-32 bottom-40 h-32 w-32 rotate-[25deg] rounded-[20px] bg-white/4" />
          {/* Glow blobs */}
          <div className="absolute top-0 right-1/4 h-[300px] w-[300px] rounded-full bg-white/3 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-[250px] w-[250px] rounded-full bg-amber-400/8 blur-3xl" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-6">

          {/* Header */}
          <div className="mb-16 text-center">
            <span className="inline-block rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-white/60">
              Why WorkLink
            </span>
            <h2 className="mt-4 text-[2.2rem] font-black tracking-tight text-white md:text-[2.6rem]">
              Built for trust.<br className="hidden md:block" /> Designed for results.
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-white/50">
              We've thought about every step of the process so you don't have to.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {WHY.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/6 p-7 backdrop-blur-sm transition hover:bg-white/10 hover:border-white/20"
              >
                {/* Corner number watermark */}
                <span className="pointer-events-none absolute -right-3 -top-4 text-[6rem] font-black leading-none text-white/4 select-none">
                  {i + 1}
                </span>

                {/* Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 transition group-hover:bg-amber-400/20">
                  <Icon className="h-6 w-6 text-white/80 transition group-hover:text-amber-300" />
                </div>

                {/* Text */}
                <h3 className="text-[17px] font-black text-white">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{desc}</p>

                {/* Bottom accent line */}
                <div className="mt-6 h-[2px] w-8 rounded-full bg-white/15 transition group-hover:w-16 group-hover:bg-amber-400/60" />
              </div>
            ))}
          </div>

          {/* Bottom stat strip */}
          <div className="mt-12 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-sm sm:gap-4 sm:px-6">
            {[
              { value: '100%', label: 'Identity verified' },
              { value: '₦0', label: 'Hidden charges' },
              { value: '24/7', label: 'Support available' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-[1.6rem] font-black text-white">{value}</p>
                <p className="mt-0.5 text-[12px] text-white/45">{label}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-5xl px-6">

          {/* Header */}
          <div className="mb-16 text-center">
            <span className="inline-block rounded-full bg-[#00511f]/8 px-4 py-1.5 text-[12px] font-bold uppercase tracking-widest text-[#00511f]">
              Testimonials
            </span>
            <h2 className="mt-4 text-[2.2rem] font-black tracking-tight text-gray-900 md:text-[2.6rem]">
              Trusted by Nigerians<br className="hidden md:block" /> across the country
            </h2>
            {/* Star summary */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[13px] font-semibold text-gray-500">4.8 out of 5 · 200+ reviews</span>
            </div>
          </div>

          {/* Cards */}
          <div className="relative grid gap-5 md:grid-cols-3">

            {/* Curved line across cards */}
            <svg
              className="pointer-events-none absolute inset-0 hidden h-full w-full md:block"
              viewBox="0 0 1000 300"
              preserveAspectRatio="none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 0 220 C 120 220, 180 80, 500 150 S 880 260, 1000 100"
                stroke="#00511f"
                strokeOpacity="0.07"
                strokeWidth="2.5"
                strokeDasharray="8 6"
                fill="none"
              />
            </svg>
            {TESTIMONIALS.map(({ name, city, rating, text }, i) => (
              <div
                key={name}
                className={`relative flex flex-col justify-between overflow-hidden rounded-3xl p-7
                  ${i === 1
                    ? 'bg-[#00511f] shadow-[0_16px_40px_rgba(0,81,31,0.25)]'
                    : 'border border-gray-100 bg-[#f9faf7] shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                  }`}
              >
                {/* Big quote mark */}
                <span className={`pointer-events-none absolute right-5 top-3 select-none text-[7rem] font-black leading-none
                  ${i === 1 ? 'text-white/8' : 'text-[#00511f]/6'}`}
                >
                  "
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(rating)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className={`flex-1 text-[14px] leading-relaxed font-medium
                  ${i === 1 ? 'text-white/85' : 'text-gray-700'}`}
                >
                  "{text}"
                </p>

                {/* Author */}
                <div className="mt-7 flex items-center gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-black
                    ${i === 1 ? 'bg-white/15 text-white' : 'bg-[#00511f] text-white'}`}
                  >
                    {getInitials(name)}
                  </div>
                  <div>
                    <p className={`text-[13px] font-bold ${i === 1 ? 'text-white' : 'text-gray-900'}`}>{name}</p>
                    <p className={`text-[11px] font-medium ${i === 1 ? 'text-white/50' : 'text-gray-400'}`}>{city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>{/* end cards grid */}

        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="px-4 pb-20 md:px-8">
        <div className="relative mx-auto overflow-hidden rounded-3xl bg-[#f5a623]">

          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0">
            {/* Rotated rectangles */}
            <div className="absolute -top-10 -right-10 h-52 w-52 rotate-[20deg] rounded-[32px] bg-gray-900/5" />
            <div className="absolute top-6 right-24 h-28 w-28 rotate-[-15deg] rounded-[20px] bg-gray-900/4" />
            <div className="absolute -bottom-12 -left-10 h-56 w-56 rotate-[-22deg] rounded-[32px] bg-gray-900/5" />
            <div className="absolute bottom-4 left-28 h-24 w-24 rotate-[18deg] rounded-[16px] bg-gray-900/4" />
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
          </div>

          <div className="relative px-5 py-16 text-center sm:px-8 md:px-16 md:py-20">

            {/* Badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-900/15 bg-gray-900/8 px-4 py-1.5 text-[12px] font-bold text-gray-900">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-900 animate-pulse" />
              500+ artisans available now
            </span>

            <h2 className="mt-5 text-[2.2rem] font-black tracking-tight text-gray-900 md:text-[3rem]">
              Your next job is one<br className="hidden md:block" /> click away.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-gray-800/65">
              Join thousands of Nigerians already using WorkLink to find trusted artisans fast.
            </p>

            {/* Buttons */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={goRegister}
                className="flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-4 text-[14px] font-bold text-white shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition hover:bg-gray-800 hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
              >
                Find a Worker <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={goRegister}
                className="flex items-center gap-2 rounded-2xl border-2 border-gray-900/25 px-8 py-4 text-[14px] font-bold text-gray-900 transition hover:bg-gray-900/8"
              >
                Register as Artisan
              </button>
            </div>

            {/* Social proof strip */}
            <div className="mt-8 flex items-center justify-center gap-6">
              {[
                { value: 'Free to join', icon: '✓' },
                { value: 'No hidden fees', icon: '✓' },
                { value: 'Cancel anytime', icon: '✓' },
              ].map(({ value, icon }) => (
                <div key={value} className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-gray-900">{icon}</span>
                  <span className="text-[12px] font-semibold text-gray-800/60">{value}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="relative overflow-hidden bg-[#0d1f14]">

        {/* Background shapes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -left-20 h-72 w-72 rotate-[-20deg] rounded-[40px] bg-white/2" />
          <div className="absolute top-10 left-32 h-36 w-36 rotate-[15deg] rounded-[24px] bg-white/2" />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rotate-[18deg] rounded-[36px] bg-white/2" />
          <div className="absolute bottom-10 right-40 h-28 w-28 rotate-[-12deg] rounded-[20px] bg-white/2" />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
        </div>

        {/* Top section */}
        <div className="relative mx-auto max-w-5xl px-4 pt-14 pb-10 sm:px-8 sm:pt-16 sm:pb-12">
          <div className="flex flex-col gap-12 md:flex-row md:gap-16">

            {/* Brand col */}
            <div className="max-w-xs flex-1">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="WorkLink" className="h-8 w-auto" />
                <span className="text-[16px] font-black text-white">WorkLink</span>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-white/40">
                Connecting skilled Nigerian artisans with customers who need quality work done — fast, safe, and transparent.
              </p>

              {/* Nigeria flag badge */}
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="inline-flex h-3.5 w-5 overflow-hidden rounded-[2px]">
                  <span className="h-full w-1/3 bg-[#008751]" />
                  <span className="h-full w-1/3 bg-white" />
                  <span className="h-full w-1/3 bg-[#008751]" />
                </span>
                <span className="text-[11px] font-semibold text-white/50">Proudly Nigerian</span>
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
              {[
                {
                  title: 'Platform',
                  links: [
                    { label: 'Find Workers', href: '#' },
                    { label: 'Join as Artisan', href: '#' },
                    { label: 'How it Works', href: '#how-it-works' },
                    { label: 'Marketplace', href: '#categories' },
                  ],
                },
                {
                  title: 'Company',
                  links: [
                    { label: 'About Us', href: '#' },
                    { label: 'Blog', href: '#' },
                    { label: 'Careers', href: '#' },
                    { label: 'Press', href: '#' },
                  ],
                },
                {
                  title: 'Legal',
                  links: [
                    { label: 'Privacy Policy', href: '#' },
                    { label: 'Terms of Service', href: '#' },
                    { label: 'Contact', href: '#' },
                    { label: 'Support', href: '#' },
                  ],
                },
              ].map(({ title, links }) => (
                <div key={title}>
                  <p className="mb-5 text-[11px] font-bold uppercase tracking-widest text-white/25">{title}</p>
                  <ul className="flex flex-col gap-3.5">
                    {links.map(({ label, href }) => (
                      <li key={label}>
                        <a
                          href={href}
                          className="group flex items-center gap-1.5 text-[13px] text-white/45 transition hover:text-[#f5a623]"
                        >
                          <span className="h-px w-0 rounded bg-[#f5a623] transition-all group-hover:w-3" />
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mx-auto max-w-5xl px-4 sm:px-8">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Bottom bar */}
        <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-[12px] text-white/25">
              © {new Date().getFullYear()} WorkLink Technologies Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[12px] text-white/25 transition hover:text-white/50">Privacy</a>
              <a href="#" className="text-[12px] text-white/25 transition hover:text-white/50">Terms</a>
              <span className="text-[12px] text-white/20">Made with ♥ in Nigeria</span>
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
}
