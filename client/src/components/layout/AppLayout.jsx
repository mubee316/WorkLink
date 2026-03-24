import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Briefcase, CreditCard, Settings, LogOut, Inbox, User, Star, MessageSquare, LayoutDashboard, Menu, X } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/useAuth';
import api from '../../lib/api';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function AppLayout({ children }) {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isWorker = userProfile?.role === 'worker';
  const [jobBadge, setJobBadge] = useState(0);
  const [msgBadge, setMsgBadge] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const convMapRef = useRef(new Map());

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Job badge
  useEffect(() => {
    api.get('/jobs/my')
      .then(({ data }) => {
        const count = isWorker
          ? data.jobs.filter((j) => j.status === 'PENDING').length
          : data.jobs.filter((j) => j.status === 'PENDING' || j.status === 'ACTIVE').length;
        setJobBadge(count);
      })
      .catch(() => {});
  }, [isWorker, location.pathname]);

  // Message badge — real-time via two Firestore onSnapshot listeners
  useEffect(() => {
    const uid = userProfile?.uid;
    if (!uid) return;

    const convMap = convMapRef.current;
    convMap.clear();

    function recalc() {
      let total = 0;
      convMap.forEach((count) => { total += count; });
      setMsgBadge(total);
    }

    function applySnapshot(snap) {
      snap.docs.forEach((doc) => {
        const data = doc.data();
        convMap.set(doc.id, data.unreadCount?.[uid] || 0);
      });
      snap.docChanges().forEach((change) => {
        if (change.type === 'removed') convMap.delete(change.doc.id);
      });
      recalc();
    }

    const col = collection(db, 'conversations');
    const unsubAs = onSnapshot(query(col, where('customerId', '==', uid)), applySnapshot);
    const unsubWk = onSnapshot(query(col, where('workerId', '==', uid)), applySnapshot);

    return () => { unsubAs(); unsubWk(); convMap.clear(); };
  }, [userProfile?.uid]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = isWorker
    ? [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
        { icon: Inbox, label: 'Job Requests', to: '/jobs', badge: jobBadge },
        { icon: MessageSquare, label: 'Messages', to: '/conversations', badge: msgBadge },
        { icon: User, label: 'My Profile', to: '/profile/edit' },
        { icon: Star, label: 'Reviews', to: '/reviews' },
        { icon: Settings, label: 'Settings', to: '/settings' },
      ]
    : [
        { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
        { icon: Search, label: 'Marketplace', to: '/workers' },
        { icon: MessageSquare, label: 'Messages', to: '/conversations', badge: msgBadge },
        { icon: Briefcase, label: 'My Jobs', to: '/jobs', badge: jobBadge },
        { icon: CreditCard, label: 'Payments', to: '/payments' },
        { icon: Settings, label: 'Settings', to: '/settings' },
      ];

  const totalBadge = jobBadge + msgBadge;

  const SidebarContent = () => (
    <>
      <Link to="/dashboard" className="mb-10 px-2 flex items-center gap-1.5">
        <img src="/logo.png" alt="WorkLink" className="h-10 w-auto" />
        <span className="text-[1.1rem] font-bold text-white/70 tracking-tight">WorkLink</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ icon: Icon, label, to, badge }) => {
          const active = location.pathname.startsWith(to);
          return (
            <Link
              key={label}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium transition
                ${active ? 'bg-white/15 text-white' : 'text-white hover:bg-white/10'}`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-[var(--color-brand-700)]">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="mb-3 flex items-center gap-3 rounded-xl px-3 py-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
          {getInitials(userProfile?.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-white">{userProfile?.name}</p>
          <span className="text-[11px] capitalize text-white/60">{userProfile?.role}</span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-3 py-3 text-[14px] font-medium text-white transition hover:bg-white/10"
      >
        <LogOut className="h-5 w-5 flex-shrink-0" />
        Logout
      </button>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-canvas)]">

      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 flex-col bg-[linear-gradient(180deg,#006d2a_0%,#00511f_100%)] px-4 py-8 text-white">
        <SidebarContent />
      </aside>

      {/* ── Mobile overlay ────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[linear-gradient(180deg,#006d2a_0%,#00511f_100%)] px-4 py-8 text-white transition-transform duration-300 md:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-4 rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-white px-4 py-3 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-1.5">
            <img src="/logo.png" alt="WorkLink" className="h-8 w-auto" />
            <span className="text-[15px] font-bold text-[var(--color-brand-700)]">WorkLink</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            className="relative rounded-xl p-2 text-[var(--color-text-body)] hover:bg-[var(--color-surface-canvas)]"
          >
            <Menu className="h-5 w-5" />
            {totalBadge > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand-500)] text-[9px] font-bold text-white">
                {totalBadge > 9 ? '9+' : totalBadge}
              </span>
            )}
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
