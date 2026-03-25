import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader, Send, Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../design';
import { useAuth } from '../contexts/useAuth';
import { useSocket } from '../contexts/SocketContext';
import api from '../lib/api';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending Payment', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ACTIVE: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Loader },
  COMPLETED: { label: 'Completed', color: 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)]', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: XCircle },
};

const PAYMENT_STATUS = {
  pending: 'Awaiting Payment',
  paid: 'Payment Held in Escrow',
  RELEASED: 'Released to Worker',
  REFUNDED: 'Refunded',
};

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [job, setJob] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeError, setDisputeError] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/jobs/${id}`);
      setJob(data.job);
      setPayment(data.payment);
    } catch {
      setError('Could not load job details.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const handlePay = async () => {
    setActionLoading('pay');
    setError('');

    const amountKobo = job.totalAmount * 100;
    const txnRef = `WORKLINK_${Date.now()}_${id}`;

    try {
      const { data } = await api.post('/payments/initiate', {
        txnRef,
        jobId: id,
        amount: amountKobo,
      });

      // Demo mode — already paid server-side, just reload
      if (data.demo) {
        await load();
        setActionLoading('');
        return;
      }

      // Real Interswitch inline checkout
      setActionLoading(''); // modal is now open; re-enable button so user isn't stuck

      window.webpayCheckout({
        merchant_code: data.merchantCode,
        pay_item_id: data.payItemId,
        txn_ref: txnRef,
        amount: amountKobo,
        currency: 566,
        cust_name: userProfile?.name || '',
        cust_email: userProfile?.email || '',
        site_redirect_url: `${window.location.origin}/payment/callback`,
        mode: 'TEST',
        onComplete: async () => {
          setActionLoading('pay');
          try {
            const verifyRes = await api.post('/payments/verify', { txnRef });
            if (verifyRes.data.success) {
              await load();
            } else {
              setError('Payment could not be verified. Please try again or contact support.');
            }
          } catch {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setActionLoading('');
          }
        },
      });
    } catch {
      setError('Failed to initiate payment.');
      setActionLoading('');
    }
  };

  const handleComplete = async () => {
    if (pin.length !== 4) {
      setPinError('Enter the 4-digit escrow PIN.');
      return;
    }
    setPinError('');
    setActionLoading('complete');
    try {
      await api.patch(`/jobs/${id}/complete`, { pin });
      await load();
    } catch (err) {
      setPinError(err.response?.data?.error || 'Failed to release payment.');
    } finally {
      setActionLoading('');
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await api.patch(`/jobs/${id}/cancel`);
      await load();
    } catch {
      setError('Failed to cancel job.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDispute = async () => {
    if (!disputeReason) { setDisputeError('Please select a reason.'); return; }
    if (disputeDesc.trim().length < 10) { setDisputeError('Please describe the issue (min 10 characters).'); return; }
    setDisputeError('');
    setActionLoading('dispute');
    try {
      await api.post(`/jobs/${id}/dispute`, { reason: disputeReason, description: disputeDesc.trim() });
      setDisputeSubmitted(true);
      setShowDisputeForm(false);
      await load();
    } catch (err) {
      setDisputeError(err.response?.data?.error || 'Failed to submit dispute.');
    } finally {
      setActionLoading('');
    }
  };

    const isCustomer = userProfile?.uid === job?.customerId;

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-4">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-strong)]"
        >
          <ArrowLeft className="h-4 w-4" />
          My Jobs
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-white border border-[var(--color-border-subtle)]" />
            <div className="h-24 animate-pulse rounded-2xl bg-white border border-[var(--color-border-subtle)]" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-[rgba(209,77,77,0.24)] bg-[rgba(209,77,77,0.08)] px-6 py-4">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
          </div>
        ) : job && (
          <div className="mx-auto max-w-xl space-y-5">
            {/* Job card */}
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white p-6 space-y-5">
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Job</p>
                  <p className="mt-1 font-semibold text-[var(--color-text-strong)]">{job.description}</p>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <span className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${cfg.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>

              {/* Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-[var(--color-surface-canvas)] p-4 text-[13px]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Customer</p>
                  <p className="font-medium text-[var(--color-text-strong)]">{job.customerName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Worker</p>
                  <p className="font-medium text-[var(--color-text-strong)]">{job.workerName}</p>
                  <p className="text-[var(--color-text-muted)]">{job.workerArea}</p>
                </div>
              </div>

              {/* Financials */}
              <div className="space-y-2 text-[13px]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Payment</p>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-body)]">₦{job.hourlyRate?.toLocaleString()} × {job.hours} hr{job.hours !== 1 ? 's' : ''}</span>
                  <span className="font-medium text-[var(--color-text-strong)]">₦{job.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Platform fee (12%)</span>
                  <span className="text-[var(--color-text-muted)]">₦{job.commission?.toLocaleString()}</span>
                </div>
                <div className="border-t border-[var(--color-border-subtle)] pt-2 flex justify-between font-bold">
                  <span className="text-[var(--color-text-strong)]">Total</span>
                  <span className="text-[var(--color-brand-700)] text-[15px]">₦{job.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Escrow status */}
              {payment && (
                <div className="rounded-xl border border-[var(--color-border-subtle)] px-4 py-3 flex items-center justify-between">
                  <p className="text-[13px] text-[var(--color-text-body)]">Escrow</p>
                  <span className="text-[13px] font-semibold text-[var(--color-brand-700)]">
                    {PAYMENT_STATUS[payment.status] || payment.status}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-1">
                {job.status === 'PENDING' && isCustomer && (
                  <Button fullWidth size="lg" isLoading={actionLoading === 'pay'} onClick={handlePay}>
                    Pay Now — ₦{job.totalAmount?.toLocaleString()}
                  </Button>
                )}
                {job.status === 'ACTIVE' && isCustomer && (
                  <div className="space-y-3 rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4">
                    {/* PIN display */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-[var(--color-brand-700)]" />
                        <span className="text-[13px] font-semibold text-[var(--color-brand-700)]">Your Escrow PIN</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPin((v) => !v)}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)]"
                      >
                        {showPin ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showPin ? 'Hide' : 'Reveal'}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {(job.escrowPin || '****').split('').map((digit, i) => (
                        <div
                          key={i}
                          className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[var(--color-brand-300)] bg-white text-[1.4rem] font-bold tracking-widest text-[var(--color-brand-700)]"
                        >
                          {showPin ? digit : '•'}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-[11px] text-[var(--color-brand-600)]">
                      Only share this PIN with the worker when you are fully satisfied
                    </p>

                    {/* Divider */}
                    <div className="border-t border-[var(--color-brand-200)] pt-3">
                      <p className="mb-2 text-[13px] font-semibold text-[var(--color-text-body)]">
                        Enter PIN to release payment
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={pin}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setPin(val);
                            setPinError('');
                          }}
                          placeholder="4-digit PIN"
                          maxLength={4}
                          className="flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-white px-4 py-2.5 text-center text-[1.2rem] font-bold tracking-[0.3em] text-[var(--color-text-strong)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
                        />
                        <Button
                          isLoading={actionLoading === 'complete'}
                          icon={ShieldCheck}
                          onClick={handleComplete}
                          size="lg"
                        >
                          Release
                        </Button>
                      </div>
                      {pinError && (
                        <p className="mt-2 text-[12px] font-medium text-[var(--color-error)]">{pinError}</p>
                      )}
                    </div>
                  </div>
                )}
                {job.status === 'ACTIVE' && isCustomer && (
                  <div className="mt-2">
                    {job.disputeRaised || disputeSubmitted ? (
                      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                        <p className="text-[13px] font-medium text-amber-700">Dispute submitted — our team will review and get back to you.</p>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowDisputeForm((v) => !v)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          {showDisputeForm ? 'Cancel Dispute' : 'Make a Dispute'}
                        </button>

                        {showDisputeForm && (
                          <div className="mt-3 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                            <p className="text-[13px] font-semibold text-red-700">What is the issue?</p>

                            <select
                              value={disputeReason}
                              onChange={(e) => { setDisputeReason(e.target.value); setDisputeError(''); }}
                              className="w-full rounded-[10px] border border-red-200 bg-white px-3 py-2.5 text-[13px] text-[var(--color-text-strong)] focus:border-red-400 focus:outline-none"
                            >
                              <option value="">Select a reason…</option>
                              <option value="Work not completed">Work not completed</option>
                              <option value="Poor quality of work">Poor quality of work</option>
                              <option value="Worker no-show">Worker no-show</option>
                              <option value="Overcharged">Overcharged</option>
                              <option value="Other">Other</option>
                            </select>

                            <textarea
                              value={disputeDesc}
                              onChange={(e) => { setDisputeDesc(e.target.value); setDisputeError(''); }}
                              placeholder="Describe the problem in detail…"
                              rows={3}
                              className="w-full rounded-[10px] border border-red-200 bg-white px-3 py-2.5 text-[13px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-red-400 focus:outline-none resize-none"
                            />

                            {disputeError && (
                              <p className="text-[12px] font-medium text-red-600">{disputeError}</p>
                            )}

                            <Button
                              fullWidth
                              isLoading={actionLoading === 'dispute'}
                              onClick={handleDispute}
                              className="!bg-red-600 hover:!bg-red-700"
                            >
                              Submit Dispute
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {job.status === 'PENDING' && (
                  <Button
                    fullWidth
                    size="lg"
                    variant="secondary"
                    isLoading={actionLoading === 'cancel'}
                    onClick={handleCancel}
                  >
                    Cancel Booking
                  </Button>
                )}
                {job.status === 'COMPLETED' && (
                  <Button fullWidth size="lg" variant="outline" onClick={() => navigate(`/review/${id}`)}>
                    Leave a Review
                  </Button>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white px-6 py-4 text-[13px] space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Booked on</span>
                <span className="font-medium text-[var(--color-text-strong)]">
                  {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
              {job.completedAt && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Completed on</span>
                  <span className="font-medium text-[var(--color-text-strong)]">
                    {new Date(job.completedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Chat */}
            {job.status !== 'CANCELLED' && (
              <ChatWindow
                jobId={id}
                otherName={isCustomer ? job.workerName : job.customerName}
                currentUid={userProfile?.uid}
              />
            )}
          </div>
        )}
      </main>
    </AppLayout>
  );
}

function ChatWindow({ jobId, otherName, currentUid }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef(null);

  // Load message history
  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/messages/${jobId}`);
        setMessages(data.messages);
      } catch {
        // non-critical — chat still works going forward
      } finally {
        setLoadingHistory(false);
      }
    }
    load();
  }, [jobId]);

  // Join room + listen for incoming messages
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_job', { jobId });
    socket.on('new_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.off('new_message');
    };
  }, [socket, jobId]);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !socket) return;

    // Optimistic add
    const optimistic = {
      id: `opt-${Date.now()}`,
      jobId,
      senderId: currentUid,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');

    socket.emit('send_message', { jobId, content });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b border-[var(--color-border-subtle)] px-5 py-4">
        <p className="text-[13px] font-bold text-[var(--color-text-strong)]">Messages</p>
        <p className="text-[12px] text-[var(--color-text-muted)]">Chat with {otherName}</p>
      </div>

      {/* Message list */}
      <div className="flex h-72 flex-col overflow-y-auto px-5 py-4 gap-3">
        {loadingHistory ? (
          <div className="flex flex-1 items-center justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-brand-500)]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-[13px] text-[var(--color-text-muted)]">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUid;
            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] leading-snug
                    ${isMine
                      ? 'rounded-br-sm bg-[var(--color-brand-500)] text-white'
                      : 'rounded-bl-sm border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-strong)]'
                    }`}
                >
                  {msg.content}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border-subtle)] px-4 py-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !socket}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-500)] text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
