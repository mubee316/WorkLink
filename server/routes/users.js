const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { db, admin } = require('../firebase-admin');

const router = express.Router();

// ─── PUT /users/settings ──────────────────────────────────────────────────────
// Update name and phoneNumber for any logged-in user
router.put('/settings', verifyToken, async (req, res) => {
  const { name, phoneNumber } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const update = {
      name: name.trim(),
      phoneNumber: phoneNumber?.trim() || '',
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(req.user.uid).update(update);

    // Keep Firebase Auth display name in sync
    await admin.auth().updateUser(req.user.uid, { displayName: name.trim() });

    res.json({ success: true });
  } catch (err) {
    console.error('Settings update error:', err.message);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ─── DELETE /users/account ────────────────────────────────────────────────────
// Permanently delete the user's account and Firestore profile
router.delete('/account', verifyToken, async (req, res) => {
  try {
    await db.collection('users').doc(req.user.uid).delete();
    await admin.auth().deleteUser(req.user.uid);
    res.json({ success: true });
  } catch (err) {
    console.error('Account delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
