const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { db } = require('../firebase-admin');

const router = express.Router();

// Admin middleware
async function requireAdmin(req, res, next) {
  const doc = await db.collection('users').doc(req.user.uid).get();
  if (doc.data()?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /admin/disputes — list all disputes with job details
router.get('/disputes', verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection('disputes').orderBy('createdAt', 'desc').get();

    const disputes = await Promise.all(
      snap.docs.map(async (doc) => {
        const dispute = { id: doc.id, ...doc.data() };
        // Attach job description
        try {
          const jobDoc = await db.collection('jobs').doc(dispute.jobId).get();
          dispute.jobDescription = jobDoc.data()?.description || '—';
        } catch {
          dispute.jobDescription = '—';
        }
        return dispute;
      })
    );

    res.json({ disputes });
  } catch (err) {
    console.error('Admin disputes error:', err.message);
    res.status(500).json({ error: 'Failed to load disputes' });
  }
});

module.exports = router;
