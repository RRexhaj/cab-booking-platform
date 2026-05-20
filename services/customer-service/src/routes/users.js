const express = require('express');
const { getDb } = require('../db/firebase');

const router = express.Router();

// GET /users/profile  (userId comes from gateway header)
router.get('/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const db = getDb();
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });

    const { passwordHash: _, ...user } = doc.data();
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const db = getDb();
    const snap = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const notifications = snap.docs.map(d => d.data());
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users/notifications  (called internally by other services / QStash)
router.post('/notifications', async (req, res) => {
  try {
    const { userId, type, message } = req.body;
    if (!userId || !type || !message) {
      return res.status(400).json({ error: 'userId, type and message are required' });
    }

    const db = getDb();
    const ref = db.collection('notifications').doc();
    const notification = {
      id: ref.id,
      userId,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await ref.set(notification);
    res.status(201).json({ notification });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('notifications').doc(req.params.id).update({ read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
