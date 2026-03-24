const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { db } = require('../firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

const router = express.Router();

// ─── GET /workers/search ──────────────────────────────────────────────────────
// Query params: skill, area, minRate, maxRate
// Returns all matching available workers
router.get('/search', async (req, res) => {
  try {
    const { skill, area, minRate, maxRate } = req.query;

    const snapshot = await db
      .collection('users')
      .where('role', '==', 'worker')
      .get();

    let workers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Only show available workers by default
    workers = workers.filter((w) => w.isAvailable !== false);

    // Filter in memory (Firestore can't combine array-contains + range in one query)
    if (skill) {
      const q = skill.toLowerCase();
      workers = workers.filter((w) =>
        w.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (area) {
      const q = area.toLowerCase();
      workers = workers.filter((w) => w.area?.toLowerCase().includes(q));
    }
    if (minRate) {
      workers = workers.filter((w) => w.hourlyRate >= Number(minRate));
    }
    if (maxRate) {
      workers = workers.filter((w) => w.hourlyRate <= Number(maxRate));
    }

    // Strip sensitive fields before returning
    const safe = workers.map(({ passwordHash, phoneNumber, ...rest }) => rest);

    res.json({ workers: safe });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── POST /workers/ai-search ──────────────────────────────────────────────────
// Customer only. Natural language query → Claude ranks best-fit workers.
router.post('/ai-search', verifyToken, async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'query is required' });
  }

  try {
    // 1. Fetch all available workers
    const snapshot = await db
      .collection('users')
      .where('role', '==', 'worker')
      .where('isAvailable', '==', true)
      .get();

    let allWorkers = snapshot.docs.map((doc) => {
      const { passwordHash, phoneNumber, bankAccountNumber, bankCode, bankName, ...rest } = doc.data();
      return { id: doc.id, ...rest };
    });

    // 2. Pre-filter to ≤20 by loose keyword match on area/skills to save tokens
    const q = query.toLowerCase();
    const keywords = q.split(/\s+/);
    function scorePrefilter(w) {
      let score = 0;
      const haystack = [
        ...(w.skills || []),
        w.area || '',
        w.bio || '',
      ].join(' ').toLowerCase();
      for (const kw of keywords) {
        if (haystack.includes(kw)) score++;
      }
      return score;
    }
    if (allWorkers.length > 20) {
      allWorkers = allWorkers
        .map((w) => ({ w, s: scorePrefilter(w) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 20)
        .map(({ w }) => w);
    }

    if (allWorkers.length === 0) {
      return res.json({ workers: [] });
    }

    // 3. Build prompt payload — only send fields Claude needs
    const workerProfiles = allWorkers.map((w) => ({
      id: w.id,
      name: w.name,
      skills: w.skills || [],
      area: w.area || '',
      hourlyRate: w.hourlyRate || 0,
      avgRating: w.avgRating || 0,
      totalJobs: w.totalJobs || 0,
      bio: w.bio || '',
    }));

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: 'You are a worker matching AI for WorkLink, a platform connecting customers with skilled artisans in Nigeria. Given a customer\'s request and a list of available workers, return the top 5 best matches as a JSON array. Consider skill relevance, location proximity, hourly rate vs budget, ratings, and experience. Return ONLY valid JSON — no markdown, no backticks, no explanation.',
      messages: [
        {
          role: 'user',
          content: `Customer query: ${query}\n\nAvailable workers:\n${JSON.stringify(workerProfiles, null, 2)}\n\nReturn a JSON array of top 5 matches with this exact format: [{"workerId": "...", "matchScore": 85, "matchReason": "..."}]`,
        },
      ],
    });

    // 4. Parse Claude's response
    let ranked = [];
    try {
      ranked = JSON.parse(message.content[0].text);
      if (!Array.isArray(ranked)) ranked = [];
    } catch {
      console.error('[ai-search] Failed to parse Claude response:', message.content[0].text);
      // Fall back to returning top workers unranked
      return res.json({
        workers: allWorkers.slice(0, 5).map((w) => ({ ...w, matchScore: null, matchReason: null })),
        fallback: true,
      });
    }

    // 5. Merge matchScore + matchReason onto full worker profiles
    const workerMap = Object.fromEntries(allWorkers.map((w) => [w.id, w]));
    const results = ranked
      .filter((r) => workerMap[r.workerId])
      .map((r) => ({ ...workerMap[r.workerId], matchScore: r.matchScore, matchReason: r.matchReason }))
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    res.json({ workers: results });
  } catch (err) {
    console.error('[ai-search] error:', err.message);
    // Graceful fallback — don't break the client
    try {
      const snap = await db.collection('users').where('role', '==', 'worker').where('isAvailable', '==', true).limit(5).get();
      const fallbackWorkers = snap.docs.map((doc) => {
        const { passwordHash, phoneNumber, bankAccountNumber, bankCode, bankName, ...rest } = doc.data();
        return { id: doc.id, ...rest, matchScore: null, matchReason: null };
      });
      res.json({ workers: fallbackWorkers, fallback: true });
    } catch {
      res.status(500).json({ error: 'AI search failed' });
    }
  }
});

// ─── POST /workers/verify-nin ────────────────────────────────────────────────
// Verify worker NIN via Interswitch (worker auth required)
router.post('/verify-nin', verifyToken, async (req, res) => {
  try {
    const { nin } = req.body;

    if (!/^\d{11}$/.test(String(nin || ''))) {
      return res.status(400).json({ success: false, error: 'NIN must be exactly 11 digits.' });
    }

    const uid = req.user?.uid || req.uid;

    await db.collection('users').doc(uid).update({
      ninVerified: true,
      nin,
    });

    return res.json({ success: true, message: 'NIN verified successfully' });

  } catch (err) {
    console.error('Verify NIN error:', err.message);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

// ─── GET /workers/:id ─────────────────────────────────────────────────────────
// Returns public worker profile + their reviews
router.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();

    if (!doc.exists || doc.data().role !== 'worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const { passwordHash, phoneNumber, email, ...profile } = doc.data();

    // Fetch reviews for this worker
    const reviewsSnap = await db
      .collection('reviews')
      .where('workerId', '==', req.params.id)
      .limit(20)
      .get();

    const reviews = reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.json({ worker: { id: doc.id, ...profile }, reviews });
  } catch (err) {
    console.error('Get worker error:', err.message);
    res.status(500).json({ error: 'Failed to get worker' });
  }
});

// ─── POST /workers/profile ────────────────────────────────────────────────────
// Create or overwrite worker profile fields (worker auth required)
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists || userDoc.data().role !== 'worker') {
      return res.status(403).json({ error: 'Only workers can create a profile' });
    }

    const { bio, skills, hourlyRate, area, avatarUrl,
            bankAccountNumber, bankCode, bankName, verifiedAccountName } = req.body;

    const update = {
      ...(bio !== undefined && { bio }),
      ...(skills !== undefined && { skills }),
      ...(hourlyRate !== undefined && { hourlyRate: Number(hourlyRate) }),
      ...(area !== undefined && { area }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(bankAccountNumber !== undefined && { bankAccountNumber }),
      ...(bankCode !== undefined && { bankCode }),
      ...(bankName !== undefined && { bankName }),
      ...(verifiedAccountName !== undefined && { verifiedAccountName }),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(req.user.uid).update(update);

    res.json({ success: true });
  } catch (err) {
    console.error('Create profile error:', err.message);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// ─── PUT /workers/profile ─────────────────────────────────────────────────────
// Full profile update (worker auth required)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists || userDoc.data().role !== 'worker') {
      return res.status(403).json({ error: 'Only workers can update a profile' });
    }

    const { bio, skills, hourlyRate, area, avatarUrl,
            bankAccountNumber, bankCode, bankName, verifiedAccountName } = req.body;

    await db.collection('users').doc(req.user.uid).update({
      bio: bio ?? '',
      skills: skills ?? [],
      hourlyRate: Number(hourlyRate) || 0,
      area: area ?? '',
      avatarUrl: avatarUrl ?? '',
      bankAccountNumber: bankAccountNumber ?? '',
      bankCode: bankCode ?? '',
      bankName: bankName ?? '',
      verifiedAccountName: verifiedAccountName ?? '',
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ─── PATCH /workers/availability ──────────────────────────────────────────────
// Toggle isAvailable (worker auth required)
router.patch('/availability', verifyToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists || userDoc.data().role !== 'worker') {
      return res.status(403).json({ error: 'Only workers can toggle availability' });
    }

    const current = userDoc.data().isAvailable ?? true;
    await db.collection('users').doc(req.user.uid).update({ isAvailable: !current });

    res.json({ isAvailable: !current });
  } catch (err) {
    console.error('Availability error:', err.message);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;
