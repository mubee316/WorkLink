const express = require('express');
const axios = require('axios');
const verifyToken = require('../middleware/verifyToken');
const { db } = require('../firebase-admin');

const router = express.Router();

function isDemoMode() {
  return process.env.DEMO_PAYMENTS !== 'false';
}

function generateEscrowPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ─── POST /payments/initiate ──────────────────────────────────────────────────
// Saves a pending payment record in Firestore.
// In demo mode: instantly marks payment paid and job ACTIVE, returns { demo: true }.
// In real mode: returns { merchantCode, payItemId } for the client to call webpayCheckout.
router.post('/initiate', verifyToken, async (req, res) => {
  const { txnRef, jobId, amount } = req.body;

  if (!txnRef || !jobId || !amount) {
    return res.status(400).json({ error: 'txnRef, jobId and amount are required' });
  }

  try {
    const now = new Date().toISOString();

    await db.collection('payments').doc(txnRef).set({
      jobId,
      uid: req.user.uid,
      amount,        // in kobo
      txnRef,
      status: 'pending',
      createdAt: now,
    });

    if (isDemoMode()) {
      const pin = generateEscrowPin();
      await db.collection('payments').doc(txnRef).update({ status: 'paid', paidAt: now });
      await db.collection('jobs').doc(jobId).update({ status: 'ACTIVE', escrowPin: pin });
      return res.json({ demo: true });
    }

    res.json({
      merchantCode: process.env.INTERSWITCH_MERCHANT_CODE,
      payItemId: process.env.INTERSWITCH_PAY_ITEM_ID,
    });
  } catch (err) {
    console.error('Payment initiate error:', err.message);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// ─── POST /payments/verify ────────────────────────────────────────────────────
// Called after webpayCheckout onComplete fires (or as fallback from /payment/callback page).
// Queries Interswitch to confirm the transaction, then updates Firestore.
router.post('/verify', verifyToken, async (req, res) => {
  const { txnRef } = req.body;
  if (!txnRef) return res.status(400).json({ error: 'txnRef required' });

  try {
    const paymentSnap = await db.collection('payments').doc(txnRef).get();
    if (!paymentSnap.exists) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const payment = paymentSnap.data();

    // Already confirmed (demo mode or duplicate callback)
    if (payment.status === 'paid') {
      return res.json({ success: true, jobId: payment.jobId });
    }

    // Query Interswitch — use stored kobo amount, not client-supplied
    const queryRes = await axios.get(
      `${process.env.INTERSWITCH_BASE_URL}/collections/api/v1/gettransaction.json` +
        `?merchantcode=${process.env.INTERSWITCH_MERCHANT_CODE}` +
        `&transactionreference=${txnRef}` +
        `&amount=${payment.amount}`
    );

    const txData = queryRes.data;

    if (txData.ResponseCode === '00') {
      const now = new Date().toISOString();
      const pin = generateEscrowPin();
      await db.collection('payments').doc(txnRef).update({ status: 'paid', paidAt: now });
      await db.collection('jobs').doc(payment.jobId).update({ status: 'ACTIVE', escrowPin: pin });
      return res.json({ success: true, jobId: payment.jobId });
    }

    res.json({ success: false, responseCode: txData.ResponseCode });
  } catch (err) {
    console.error('Payment verify error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── GET /payments/my ─────────────────────────────────────────────────────────
// Returns all payments made by the logged-in customer, with job details attached.
router.get('/my', verifyToken, async (req, res) => {
  try {
    const snap = await db
      .collection('payments')
      .where('uid', '==', req.user.uid)
      .get();

    const payments = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Sort by createdAt desc in memory (avoids composite index requirement)
    payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Attach job info (description + workerName) for each unique jobId
    const jobIds = [...new Set(payments.map((p) => p.jobId).filter(Boolean))];
    const jobMap = {};
    await Promise.all(
      jobIds.map(async (jobId) => {
        const doc = await db.collection('jobs').doc(jobId).get();
        if (doc.exists) jobMap[jobId] = doc.data();
      })
    );

    const enriched = payments.map((p) => ({
      ...p,
      jobDescription: jobMap[p.jobId]?.description || '',
      workerName: jobMap[p.jobId]?.workerName || '',
      jobStatus: jobMap[p.jobId]?.status || '',
    }));

    res.json({ payments: enriched });
  } catch (err) {
    console.error('Payments list error:', err.message);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router;
