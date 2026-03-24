const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { db } = require('../firebase-admin');
const { transferFunds } = require('../services/interswitchTransfer');

const router = express.Router();

const COMMISSION_RATE = 0.12; // 12%

// ─── POST /jobs ───────────────────────────────────────────────────────────────
// Customer creates a job booking
router.post('/', verifyToken, async (req, res) => {
  try {
    const { workerId, description, hours } = req.body;

    if (!workerId || !description || !hours) {
      return res.status(400).json({ error: 'workerId, description, and hours are required' });
    }

    // Fetch worker to get hourlyRate and name
    const workerDoc = await db.collection('users').doc(workerId).get();
    if (!workerDoc.exists || workerDoc.data().role !== 'worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }
    const worker = workerDoc.data();

    // Fetch customer name
    const customerDoc = await db.collection('users').doc(req.user.uid).get();
    const customer = customerDoc.data();

    const hourlyRate = Number(worker.hourlyRate);
    const totalAmount = hourlyRate * Number(hours);
    const commission = totalAmount * COMMISSION_RATE;
    const workerPayout = totalAmount - commission;

    const jobRef = db.collection('jobs').doc();
    const job = {
      id: jobRef.id,
      customerId: req.user.uid,
      customerName: customer?.name || '',
      workerId,
      workerName: worker.name,
      workerArea: worker.area || worker.location || '',
      description,
      hours: Number(hours),
      hourlyRate,
      totalAmount,
      commission,
      workerPayout,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    await jobRef.set(job);
    res.status(201).json({ job });
  } catch (err) {
    console.error('Create job error:', err.message);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// ─── GET /jobs/my ─────────────────────────────────────────────────────────────
// List all jobs for the current user (as customer or worker)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Fetch as customer
    const customerSnap = await db
      .collection('jobs')
      .where('customerId', '==', uid)
      .get();

    // Fetch as worker
    const workerSnap = await db
      .collection('jobs')
      .where('workerId', '==', uid)
      .get();

    const seen = new Set();
    const jobs = [];

    for (const doc of [...customerSnap.docs, ...workerSnap.docs]) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        jobs.push({ id: doc.id, ...doc.data() });
      }
    }

    // Sort by createdAt desc in memory
    jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ jobs });
  } catch (err) {
    console.error('List jobs error:', err.message);
    res.status(500).json({ error: 'Failed to list jobs' });
  }
});

// ─── GET /jobs/:id ────────────────────────────────────────────────────────────
// Get a single job (must be customer or worker of that job)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('jobs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Job not found' });

    const job = { id: doc.id, ...doc.data() };

    if (job.customerId !== req.user.uid && job.workerId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Attach payment record if exists
    const paymentSnap = await db
      .collection('payments')
      .where('jobId', '==', req.params.id)
      .limit(1)
      .get();

    const payment = paymentSnap.empty ? null : { id: paymentSnap.docs[0].id, ...paymentSnap.docs[0].data() };

    res.json({ job, payment });
  } catch (err) {
    console.error('Get job error:', err.message);
    res.status(500).json({ error: 'Failed to get job' });
  }
});

// ─── PATCH /jobs/:id/complete ─────────────────────────────────────────────────
// Customer marks job as complete → triggers escrow release
router.patch('/:id/complete', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('jobs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Job not found' });

    const job = doc.data();

    if (job.customerId !== req.user.uid) {
      return res.status(403).json({ error: 'Only the customer can mark a job complete' });
    }
    if (job.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Job must be ACTIVE to complete' });
    }

    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'Escrow PIN is required to release payment' });
    }
    if (pin !== job.escrowPin) {
      return res.status(400).json({ error: 'Incorrect PIN. Please check and try again.' });
    }

    const completedAt = new Date().toISOString();
    await db.collection('jobs').doc(req.params.id).update({
      status: 'COMPLETED',
      completedAt,
      payoutStatus: 'pending',
    });

    // Release escrow — update payment status to RELEASED
    const paymentSnap = await db
      .collection('payments')
      .where('jobId', '==', req.params.id)
      .limit(1)
      .get();

    if (!paymentSnap.empty) {
      await paymentSnap.docs[0].ref.update({
        status: 'RELEASED',
        releasedAt: completedAt,
      });
    }

    // Respond immediately — payout runs async and does not block the customer
    res.json({ success: true, status: 'COMPLETED' });

    // ── Non-blocking payout ──────────────────────────────────────────────────
    ;(async () => {
      const jobId = req.params.id;
      try {
        const workerDoc = await db.collection('users').doc(job.workerId).get();
        const worker = workerDoc.data();

        if (!worker?.bankAccountNumber || !worker?.bankCode) {
          await db.collection('jobs').doc(jobId).update({ payoutStatus: 'no_bank_account' });
          console.warn(`Payout skipped for job ${jobId}: worker has no bank account on file`);
          return;
        }

        const amountKobo = Math.round(job.workerPayout * 100);
        const demoMode = process.env.DEMO_PAYMENTS === 'true';

        let payoutRef_val, transactionRef;

        if (demoMode) {
          // ── Demo mode: simulate successful payout ──────────────────────────
          transactionRef = `DEMO-${Date.now()}-${jobId.slice(-6)}`;
          console.log(`[Payout] DEMO mode — simulating success for job ${jobId}`);
        } else {
          // ── Live mode: call Interswitch Transfer API ───────────────────────
          const result = await transferFunds({
            amountKobo,
            accountNumber: worker.bankAccountNumber,
            bankCode: worker.bankCode,
            workerName: worker.name || job.workerName,
            jobId,
          });

          if (
            result.ResponseCodeGrouping !== 'SUCCESSFUL' &&
            result.ResponseCode !== '90000'
          ) {
            await db.collection('jobs').doc(jobId).update({ payoutStatus: 'failed' });
            console.error(`Payout failed for job ${jobId} — ResponseCode: ${result.ResponseCode}`);
            return;
          }

          transactionRef = result.TransactionReference || result.transferCode;
          console.log(`Payout completed for job ${jobId} — ref: ${transactionRef}`);
        }

        const payoutRef = db.collection('payouts').doc();
        await payoutRef.set({
          id: payoutRef.id,
          jobId,
          workerId: job.workerId,
          totalAmount: job.totalAmount,
          commission: job.commission,
          workerPayout: job.workerPayout,
          amountKobo,
          transactionReference: transactionRef,
          status: 'completed',
          demo: demoMode,
          createdAt: new Date().toISOString(),
        });

        await db.collection('jobs').doc(jobId).update({
          payoutStatus: 'completed',
          payoutReference: transactionRef,
        });
      } catch (err) {
        await db.collection('jobs').doc(jobId).update({ payoutStatus: 'failed' }).catch(() => {});
        console.error(`Payout error for job ${jobId}:`, err.message);
      }
    })();
  } catch (err) {
    console.error('Complete job error:', err.message);
    res.status(500).json({ error: 'Failed to complete job' });
  }
});

// ─── PATCH /jobs/:id/cancel ───────────────────────────────────────────────────
// Cancel a PENDING job (customer or worker)
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('jobs').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Job not found' });

    const job = doc.data();

    if (job.customerId !== req.user.uid && job.workerId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (job.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only PENDING jobs can be cancelled' });
    }

    await db.collection('jobs').doc(req.params.id).update({ status: 'CANCELLED' });

    res.json({ success: true, status: 'CANCELLED' });
  } catch (err) {
    console.error('Cancel job error:', err.message);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

module.exports = router;
