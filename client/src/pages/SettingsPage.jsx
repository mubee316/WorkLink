import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Lock, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/useAuth';
import { auth, db } from '../firebase';
import api from '../lib/api';

function Section({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white">
      <div className="border-b border-[var(--color-border-subtle)] px-6 py-4">
        <h2 className="text-[14px] font-bold text-[var(--color-text-strong)]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-semibold text-[var(--color-text-muted)]">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
      {...props}
    />
  );
}

function Toast({ type, message }) {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] font-medium
      ${isError
        ? 'border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] text-[var(--color-error)]'
        : 'border-[rgba(55,166,83,0.24)] bg-[rgba(55,166,83,0.08)] text-[var(--color-brand-700)]'
      }`}
    >
      {isError
        ? <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        : <CheckCircle className="h-4 w-4 flex-shrink-0" />
      }
      {message}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSettings({ userProfile, onProfileUpdate }) {
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      await api.put('/users/settings', { name, phoneNumber: phone });
      // Update local Firestore cache so UI reflects immediately
      await updateDoc(doc(db, 'users', userProfile.uid), { name, phoneNumber: phone });
      onProfileUpdate({ name, phoneNumber: phone });
      setToast({ type: 'success', message: 'Profile updated successfully.' });
    } catch {
      setToast({ type: 'error', message: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Profile"
      description="Update your name and contact number."
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {toast && <Toast {...toast} />}
        <Field label="Full Name">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />
        </Field>
        <Field label="Phone Number">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            type="tel"
          />
        </Field>
        <Field label="Email">
          <Input value={userProfile?.email || ''} disabled className="cursor-not-allowed opacity-60" />
          <p className="text-[11px] text-[var(--color-text-muted)]">Email cannot be changed.</p>
        </Field>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Section>
  );
}

// ─── Password Section ─────────────────────────────────────────────────────────
function PasswordSettings({ userProfile }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  async function handleChange(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setSaving(true);
    setToast(null);
    try {
      const credential = EmailAuthProvider.credential(userProfile.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ type: 'success', message: 'Password changed successfully.' });
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Current password is incorrect.'
        : 'Failed to change password. Please try again.';
      setToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Password"
      description="You'll need to enter your current password to set a new one."
    >
      <form onSubmit={handleChange} className="flex flex-col gap-4">
        {toast && <Toast {...toast} />}
        <Field label="Current Password">
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            required
          />
        </Field>
        <Field label="New Password">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </Field>
        <Field label="Confirm New Password">
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            required
          />
        </Field>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {saving ? 'Changing…' : 'Change Password'}
          </button>
        </div>
      </form>
    </Section>
  );
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────
function DangerZone({ logout }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const { userProfile } = useAuth();

  async function handleDelete(e) {
    e.preventDefault();
    setDeleting(true);
    setError('');
    try {
      const credential = EmailAuthProvider.credential(userProfile.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await api.delete('/users/account');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Incorrect password.'
        : 'Failed to delete account. Please try again.';
      setError(msg);
      setDeleting(false);
    }
  }

  return (
    <Section title="Danger Zone">
      {!confirming ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-[var(--color-text-strong)]">Delete Account</p>
            <p className="mt-0.5 text-[12px] text-[var(--color-text-muted)]">
              Permanently remove your account and all associated data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setConfirming(true)}
            className="ml-6 flex flex-shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-100"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      ) : (
        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-[13px] font-semibold text-red-700">Are you sure?</p>
            <p className="mt-0.5 text-[12px] text-red-600">
              This will permanently delete your account, profile, and all data. Enter your password to confirm.
            </p>
          </div>
          {error && <Toast type="error" message={error} />}
          <Field label="Confirm Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </Field>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setConfirming(false); setPassword(''); setError(''); }}
              className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-2.5 text-[13px] font-semibold text-[var(--color-text-body)] transition hover:border-[var(--color-border-strong)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={deleting}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
            </button>
          </div>
        </form>
      )}
    </Section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { userProfile, logout } = useAuth();
  const [localProfile, setLocalProfile] = useState(userProfile);

  function handleProfileUpdate(updates) {
    setLocalProfile((prev) => ({ ...prev, ...updates }));
  }

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-5">
        <h1 className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">Settings</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">Manage your account preferences</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="mx-auto max-w-2xl flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-50)]">
              <User className="h-5 w-5 text-[var(--color-brand-600)]" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[var(--color-text-strong)]">{localProfile?.name}</p>
              <p className="text-[12px] text-[var(--color-text-muted)] capitalize">{localProfile?.role}</p>
            </div>
          </div>

          <ProfileSettings userProfile={localProfile} onProfileUpdate={handleProfileUpdate} />
          <PasswordSettings userProfile={localProfile} />
          <DangerZone logout={logout} />
        </div>
      </main>
    </AppLayout>
  );
}
