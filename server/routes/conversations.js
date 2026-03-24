const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const { db } = require('../firebase-admin');
const { admin } = require('../firebase-admin');
const FieldValue = admin.firestore.FieldValue;
const { generateOpeningMessage } = require('../services/aiBooking');

const router = express.Router();

// ─── POST /conversations ──────────────────────────────────────────────────────
// Create or return an existing conversation between a customer and a worker.
router.post('/', verifyToken, async (req, res) => {
  const { workerId } = req.body;
  if (!workerId) return res.status(400).json({ error: 'workerId required' });

  const customerId = req.user.uid;
  if (customerId === workerId) {
    return res.status(400).json({ error: 'Cannot start a conversation with yourself' });
  }

  try {
    // Return existing conversation if one already exists
    const existing = await db.collection('conversations')
      .where('customerId', '==', customerId)
      .where('workerId', '==', workerId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.json({ conversation: { id: existing.docs[0].id, ...existing.docs[0].data() } });
    }

    const [customerDoc, workerDoc] = await Promise.all([
      db.collection('users').doc(customerId).get(),
      db.collection('users').doc(workerId).get(),
    ]);

    if (!workerDoc.exists || workerDoc.data().role !== 'worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const customer = customerDoc.data();
    const worker = workerDoc.data();

    const ref = db.collection('conversations').doc();
    const now = new Date().toISOString();
    const conversation = {
      id: ref.id,
      customerId,
      workerId,
      customerName: customer.name || '',
      workerName: worker.name || '',
      workerArea: worker.area || worker.location || '',
      workerSkills: worker.skills || [],
      workerHourlyRate: worker.hourlyRate || 0,
      lastMessage: '',
      lastMessageAt: now,
      unreadCount: {},
      createdAt: now,
    };

    await ref.set(conversation);
    res.status(201).json({ conversation });
  } catch (err) {
    console.error('Create conversation error:', err.message);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// ─── GET /conversations/my ────────────────────────────────────────────────────
// List all conversations for the current user (as customer or worker).
router.get('/my', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;

    const [asCustomer, asWorker] = await Promise.all([
      db.collection('conversations').where('customerId', '==', uid).get(),
      db.collection('conversations').where('workerId', '==', uid).get(),
    ]);

    const seen = new Set();
    const conversations = [];
    for (const doc of [...asCustomer.docs, ...asWorker.docs]) {
      if (!seen.has(doc.id)) {
        seen.add(doc.id);
        conversations.push({ id: doc.id, ...doc.data() });
      }
    }

    conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    res.json({ conversations });
  } catch (err) {
    console.error('List conversations error:', err.message);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// ─── GET /conversations/:id ───────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('conversations').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Conversation not found' });

    const conv = doc.data();
    if (conv.customerId !== req.user.uid && conv.workerId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ conversation: { id: doc.id, ...conv } });
  } catch (err) {
    console.error('Get conversation error:', err.message);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// ─── PATCH /conversations/:id/read ───────────────────────────────────────────
// Mark a conversation as read for the current user.
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('conversations').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });

    const conv = doc.data();
    if (conv.customerId !== req.user.uid && conv.workerId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.collection('conversations').doc(req.params.id).update({
      [`unreadCount.${req.user.uid}`]: 0,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Mark read error:', err.message);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ─── GET /conversations/:id/messages ─────────────────────────────────────────
router.get('/:id/messages', verifyToken, async (req, res) => {
  try {
    const doc = await db.collection('conversations').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Conversation not found' });

    const conv = doc.data();
    if (conv.customerId !== req.user.uid && conv.workerId !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snap = await db.collection('messages')
      .where('conversationId', '==', req.params.id)
      .get();

    const messages = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    res.json({ messages });
  } catch (err) {
    console.error('Get conversation messages error:', err.message);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// ─── POST /conversations/ai-book ─────────────────────────────────────────────
// Customer triggers AI to book a worker on their behalf.
router.post('/ai-book', verifyToken, async (req, res) => {
  const { workerId, jobDescription, preferredDate, budget } = req.body;
  if (!workerId || !jobDescription || !budget) {
    return res.status(400).json({ error: 'workerId, jobDescription, and budget are required' });
  }

  const customerId = req.user.uid;
  if (customerId === workerId) {
    return res.status(400).json({ error: 'Cannot book yourself' });
  }

  try {
    const [customerDoc, workerDoc] = await Promise.all([
      db.collection('users').doc(customerId).get(),
      db.collection('users').doc(workerId).get(),
    ]);

    if (!workerDoc.exists || workerDoc.data().role !== 'worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const customer = customerDoc.data();
    const worker = workerDoc.data();

    const aiContext = { jobDescription, preferredDate: preferredDate || 'flexible', budget };

    const ref = db.collection('conversations').doc();
    const now = new Date().toISOString();
    const conversation = {
      id: ref.id,
      customerId,
      workerId,
      customerName: customer.name || '',
      workerName: worker.name || '',
      workerArea: worker.area || worker.location || '',
      workerSkills: worker.skills || [],
      workerHourlyRate: worker.hourlyRate || 0,
      lastMessage: '',
      lastMessageAt: now,
      unreadCount: {},
      createdAt: now,
      aiManaged: true,
      aiContext,
      bookingAgreed: false,
    };

    await ref.set(conversation);

    // Generate and save the AI opening message
    const openingText = await generateOpeningMessage(conversation, aiContext);

    const msgRef = db.collection('messages').doc();
    const message = {
      id: msgRef.id,
      conversationId: ref.id,
      senderId: 'ai',
      senderName: 'WorkLink AI',
      content: openingText,
      createdAt: new Date().toISOString(),
    };
    await msgRef.set(message);

    await ref.update({
      lastMessage: openingText.slice(0, 80),
      lastMessageAt: message.createdAt,
      [`unreadCount.${workerId}`]: FieldValue.increment(1),
    });

    res.status(201).json({ conversation: { ...conversation, id: ref.id } });
  } catch (err) {
    console.error('[ai-book] error:', err.message);
    res.status(500).json({ error: 'Failed to start AI booking' });
  }
});

module.exports = router;
