import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, ToggleLeft, ToggleRight, CheckCircle, Loader } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Moniepoint MFB' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '999992', name: 'Opay' },
  { code: '999991', name: 'PalmPay' },
  { code: '999993', name: 'Kuda Bank' },
];

export default function ProfileEditPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState(userProfile?.bio || '');
  const [area, setArea] = useState(userProfile?.area || userProfile?.location || '');
  const [hourlyRate, setHourlyRate] = useState(userProfile?.hourlyRate || '');
  const [skills, setSkills] = useState(userProfile?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [isAvailable, setIsAvailable] = useState(userProfile?.isAvailable ?? true);

  const [saving, setSaving] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Bank details
  const [bankCode, setBankCode] = useState(userProfile?.bankCode || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(userProfile?.bankAccountNumber || '');
  const [verifiedAccountName, setVerifiedAccountName] = useState(userProfile?.verifiedAccountName || '');
  const [bankVerifying, setBankVerifying] = useState(false);
  const [bankError, setBankError] = useState('');
  const [bankSaved, setBankSaved] = useState(false);

  function addSkill() {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) { setSkillInput(''); return; }
    setSkills((prev) => [...prev, s]);
    setSkillInput('');
  }

  function removeSkill(skill) {
    setSkills((prev) => prev.filter((s) => s !== skill));
  }

  function handleSkillKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  }

  async function handleVerifyAccount() {
    if (!bankCode || bankAccountNumber.length !== 10) return;
    setBankVerifying(true);
    setBankError('');
    setVerifiedAccountName('');
    try {
      const { data } = await api.post('/transfers/verify-account', { bankCode, accountNumber: bankAccountNumber });
      setVerifiedAccountName(data.accountName);
    } catch (err) {
      setBankError(err.response?.data?.error || 'Could not verify account. Check the details and try again.');
    } finally {
      setBankVerifying(false);
    }
  }

  async function handleSaveBankDetails() {
    if (!verifiedAccountName) { setBankError('Please verify your account first.'); return; }
    setBankError('');
    setBankSaved(false);
    setSaving(true);
    try {
      const bankName = NIGERIAN_BANKS.find((b) => b.code === bankCode)?.name || '';
      await api.put('/workers/profile', { bankCode, bankAccountNumber, bankName, verifiedAccountName });
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3000);
    } catch {
      setBankError('Failed to save bank details.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAvailability() {
    setTogglingAvail(true);
    try {
      const { data } = await api.patch('/workers/availability');
      setIsAvailable(data.isAvailable);
    } catch {
      setError('Failed to update availability.');
    } finally {
      setTogglingAvail(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put('/workers/profile', {
        bio,
        area,
        hourlyRate: Number(hourlyRate) || 0,
        skills,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  // Only workers can access this page
  if (userProfile?.role !== 'worker') {
    navigate('/dashboard');
    return null;
  }

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-5">
        <h1 className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">My Profile</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Keep your profile up to date to attract more customers
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="mx-auto max-w-xl space-y-6">

          {/* Avatar + name */}
          <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border-subtle)] bg-white px-6 py-5">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-lg font-bold text-white">
              {(userProfile?.name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[var(--color-text-strong)]">{userProfile?.name}</p>
              <p className="text-[13px] text-[var(--color-text-muted)]">{userProfile?.email}</p>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-white px-6 py-4">
            <div>
              <p className="font-semibold text-[var(--color-text-strong)]">Available for work</p>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                {isAvailable ? 'You appear in search results' : 'Hidden from search results'}
              </p>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvail}
              className="disabled:opacity-50"
            >
              {isAvailable
                ? <ToggleRight className="h-8 w-8 text-[var(--color-brand-500)]" />
                : <ToggleLeft className="h-8 w-8 text-[var(--color-text-muted)]" />
              }
            </button>
          </div>

          {/* Profile form */}
          <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-white px-6 py-5">

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-strong)]">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your experience and what you specialise in…"
                rows={3}
                className="w-full resize-none rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-strong)]">
                Area / Location
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. Lagos Island, Abuja FCT"
                className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-strong)]">
                Hourly Rate (₦)
              </label>
              <input
                type="number"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-strong)]">
                Skills
              </label>
              {skills.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1 rounded-full bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-brand-700)]"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="flex items-center text-[var(--color-brand-500)] hover:text-[var(--color-brand-700)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-500)]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-[var(--color-error)]">{error}</p>
            )}

            {saved && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-[13px] font-semibold text-[var(--color-brand-700)]">
                <CheckCircle className="h-4 w-4" />
                Profile saved!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[var(--color-brand-500)] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </form>
          {/* Bank Details */}
          <div className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-white px-6 py-5">
            <div>
              <p className="font-semibold text-[var(--color-text-strong)]">Bank Details</p>
              <p className="text-[12px] text-[var(--color-text-muted)]">Required to receive payouts when jobs are completed</p>
            </div>

            {userProfile?.verifiedAccountName && !verifiedAccountName && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] px-4 py-2.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-brand-600)]" />
                <p className="text-[13px] font-medium text-[var(--color-brand-700)]">
                  Current: {userProfile.verifiedAccountName} — {userProfile.bankName}
                </p>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-strong)]">Bank</label>
              <select
                value={bankCode}
                onChange={(e) => { setBankCode(e.target.value); setVerifiedAccountName(''); setBankError(''); }}
                className="w-full rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
              >
                <option value="">Select your bank…</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-strong)]">Account Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => { setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setVerifiedAccountName(''); setBankError(''); }}
                  placeholder="10-digit account number"
                  maxLength={10}
                  className="flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
                />
                <button
                  type="button"
                  onClick={handleVerifyAccount}
                  disabled={!bankCode || bankAccountNumber.length !== 10 || bankVerifying}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--color-brand-500)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-brand-600)] transition hover:bg-[var(--color-brand-50)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bankVerifying ? <Loader className="h-4 w-4 animate-spin" /> : 'Verify'}
                </button>
              </div>
              <p className="mt-1 text-[12px] text-[var(--color-text-muted)]">{bankAccountNumber.length}/10 digits</p>
            </div>

            {verifiedAccountName && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-200)] px-4 py-2.5">
                <CheckCircle className="h-4 w-4 text-[var(--color-brand-600)]" />
                <p className="text-[13px] font-semibold text-[var(--color-brand-700)]">{verifiedAccountName}</p>
              </div>
            )}

            {bankError && (
              <p className="rounded-lg bg-red-50 px-4 py-2.5 text-[13px] text-[var(--color-error)]">{bankError}</p>
            )}

            {bankSaved && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-[13px] font-semibold text-[var(--color-brand-700)]">
                <CheckCircle className="h-4 w-4" />
                Bank details saved!
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveBankDetails}
              disabled={!verifiedAccountName || saving}
              className="w-full rounded-xl bg-[var(--color-brand-500)] py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save Bank Details'}
            </button>
          </div>

        </div>
      </main>
    </AppLayout>
  );
}
