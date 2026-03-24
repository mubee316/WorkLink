const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { db } = require('../firebase-admin');

const router = express.Router();

// ─── GET /messages/:jobId ─────────────────────────────────────────────────────
// Load message history for a job. Only the customer or worker on the job can read.
router.get('/:jobId', verifyToken, async (req, res) => {
  try {
    const { jobId } = req.params;

    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) return res.status(404).json({ error: 'Job not found' });

    const job = jobDoc.data();
    if (job.customerId !== req.user.uid && job.workerId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snap = await db.collection('messages').where('jobId', '==', jobId).get();

    const messages = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({ messages });
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

module.exports = router;
