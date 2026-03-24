const { admin } = require('../firebase-admin');

// Attach this middleware to any route that requires a logged-in user.
// The client sends: Authorization: Bearer <firebase-id-token>
async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  const token = header.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, ... }
    next();
  } catch {
    res.status(401).json({ error: 'Token verification failed' });
  }
}

module.exports = verifyToken;
