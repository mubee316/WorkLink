const { admin, db } = require('../firebase-admin');
const FieldValue = admin.firestore.FieldValue;
const { generateReply } = require('../services/aiBooking');

function chatHandler(io) {
  // ── Auth middleware ───────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // ── Job chat ────────────────────────────────────────────────────────────────
    socket.on('join_job', ({ jobId }) => {
      if (jobId) socket.join(jobId);
    });

    socket.on('send_message', async ({ jobId, content }) => {
      if (!jobId || !content?.trim()) return;
      try {
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        if (!jobDoc.exists) return;
        const job = jobDoc.data();
        if (job.customerId !== socket.user.uid && job.workerId !== socket.user.uid) return;

        const userDoc = await db.collection('users').doc(socket.user.uid).get();
        const senderName = userDoc.exists ? userDoc.data().name : '';

        const msgRef = db.collection('messages').doc();
        const message = {
          id: msgRef.id,
          jobId,
          senderId: socket.user.uid,
          senderName,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        };

        await msgRef.set(message);
        socket.to(jobId).emit('new_message', message);
      } catch (err) {
        console.error('send_message error:', err.message);
      }
    });

    // ── Conversation chat (pre-booking) ─────────────────────────────────────────
    socket.on('join_conversation', ({ conversationId }) => {
      if (conversationId) socket.join(conversationId);
    });

    socket.on('send_conversation_message', async ({ conversationId, content }) => {
      if (!conversationId || !content?.trim()) return;
      try {
        const convDoc = await db.collection('conversations').doc(conversationId).get();
        if (!convDoc.exists) return;
        const conv = convDoc.data();
        if (conv.customerId !== socket.user.uid && conv.workerId !== socket.user.uid) return;

        const userDoc = await db.collection('users').doc(socket.user.uid).get();
        const senderName = userDoc.exists ? userDoc.data().name : '';

        const msgRef = db.collection('messages').doc();
        const message = {
          id: msgRef.id,
          conversationId,
          senderId: socket.user.uid,
          senderName,
          content: content.trim(),
          createdAt: new Date().toISOString(),
        };

        await msgRef.set(message);

        const recipientId = conv.customerId === socket.user.uid
          ? conv.workerId
          : conv.customerId;

        await db.collection('conversations').doc(conversationId).update({
          lastMessage: content.trim().slice(0, 80),
          lastMessageAt: message.createdAt,
          [`unreadCount.${recipientId}`]: FieldValue.increment(1),
        });

        socket.to(conversationId).emit('new_conversation_message', message);

        // ── AI auto-reply if this is an AI-managed conversation and the worker sent this ──
        if (conv.aiManaged && socket.user.uid === conv.workerId && !conv.bookingAgreed) {
          try {
            // Load conversation history (last 20 messages)
            const historySnap = await db.collection('messages')
              .where('conversationId', '==', conversationId)
              .get();
            const history = historySnap.docs
              .map((d) => d.data())
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .slice(-20);

            const { text, bookingConfirmed, bookingData } = await generateReply(conv, conv.aiContext, history);

            const aiMsgRef = db.collection('messages').doc();
            const aiMessage = {
              id: aiMsgRef.id,
              conversationId,
              senderId: 'ai',
              senderName: 'WorkLink AI',
              content: text,
              createdAt: new Date().toISOString(),
            };
            await aiMsgRef.set(aiMessage);

            const updates = {
              lastMessage: text.slice(0, 80),
              lastMessageAt: aiMessage.createdAt,
              [`unreadCount.${conv.workerId}`]: FieldValue.increment(1),
            };

            if (bookingConfirmed && bookingData) {
              updates.bookingAgreed = true;
              updates.agreedHours = bookingData.hours;
              updates.agreedTotalPrice = bookingData.totalPrice;
              updates.agreedDate = bookingData.date;
              // Notify customer unread too
              updates[`unreadCount.${conv.customerId}`] = FieldValue.increment(1);

              // Send a separate confirmation card message
              const confirmMsgRef = db.collection('messages').doc();
              const confirmMsg = {
                id: confirmMsgRef.id,
                conversationId,
                senderId: 'ai',
                senderName: 'WorkLink AI',
                content: `✅ Booking agreed! ${conv.workerName} is available for ${bookingData.hours} hour(s) on ${bookingData.date}. Total: ₦${Number(bookingData.totalPrice).toLocaleString()}. Tap "Confirm & Pay" to complete your booking.`,
                isBookingCard: true,
                createdAt: new Date(Date.now() + 100).toISOString(),
              };
              await confirmMsgRef.set(confirmMsg);
              io.to(conversationId).emit('new_conversation_message', confirmMsg);
              io.to(conversationId).emit('booking_agreed', { conversationId, ...bookingData, workerName: conv.workerName, workerId: conv.workerId });
            }

            await db.collection('conversations').doc(conversationId).update(updates);
            io.to(conversationId).emit('new_conversation_message', aiMessage);
          } catch (aiErr) {
            console.error('[ai-reply] error:', aiErr.message);
          }
        }
      } catch (err) {
        console.error('send_conversation_message error:', err.message);
      }
    });
  });
}

module.exports = chatHandler;
