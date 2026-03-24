const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { db } = require('../firebase-admin');

const router = express.Router();

// ─── POST /reviews ────────────────────────────────────────────────────────────
// Customer submits a review after job completion. One review per job.
router.post('/', verifyToken, async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;

    if (!jobId || !rating) {
      return res.status(400).json({ error: 'jobId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify job exists and is completed
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) return res.status(404).json({ error: 'Job not found' });

    const job = jobDoc.data();
    if (job.customerId !== req.user.uid) {
      return res.status(403).json({ error: 'Only the customer can leave a review' });
    }
    if (job.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Job must be completed before reviewing' });
    }

    // Prevent duplicate reviews
    const existing = await db.collection('reviews').where('jobId', '==', jobId).limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'A review already exists for this job' });
    }

    // Fetch customer name
    const customerDoc = await db.collection('users').doc(req.user.uid).get();
    const customerName = customerDoc.exists ? customerDoc.data().name : '';

    const reviewRef = db.collection('reviews').doc();
    await reviewRef.set({
      id: reviewRef.id,
      jobId,
      customerId: req.user.uid,
      customerName,
      workerId: job.workerId,
      rating: Number(rating),
      comment: comment?.trim() || '',
      createdAt: new Date().toISOString(),
    });

    // Recalculate worker's avgRating and totalJobs
    const allReviews = await db.collection('reviews').where('workerId', '==', job.workerId).get();
    const ratings = allReviews.docs.map((d) => d.data().rating);
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

    await db.collection('users').doc(job.workerId).update({
      avgRating: Math.round(avgRating * 10) / 10,
      totalJobs: ratings.length,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Submit review error:', err.message);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ─── GET /reviews/worker/:workerId ────────────────────────────────────────────
router.get('/worker/:workerId', async (req, res) => {
  try {
    const snap = await db.collection('reviews').where('workerId', '==', req.params.workerId).get();
    const reviews = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ reviews });
  } catch (err) {
    console.error('Get reviews error:', err.message);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// ─── GET /reviews/job/:jobId ──────────────────────────────────────────────────
// Check if a review already exists for a job (used by ReviewPage)
router.get('/job/:jobId', verifyToken, async (req, res) => {
  try {
    const snap = await db.collection('reviews').where('jobId', '==', req.params.jobId).limit(1).get();
    const review = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
    res.json({ review });
  } catch (err) {
    console.error('Get job review error:', err.message);
    res.status(500).json({ error: 'Failed to check review' });
  }
});

module.exports = router;
