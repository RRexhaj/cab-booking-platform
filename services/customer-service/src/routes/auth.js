const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/firebase');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { firstName, surname, email, password } = req.body;
    if (!firstName || !surname || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = getDb();
    const existing = await db.collection('users').where('email', '==', email).get();
    if (!existing.empty) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRef = db.collection('users').doc();
    const user = {
      id: userRef.id,
      firstName,
      surname,
      email,
      passwordHash,
      discountAvailable: false,
      createdAt: new Date().toISOString(),
    };
    await userRef.set(user);

    const token = jwt.sign({ userId: userRef.id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...userPublic } = user;
    res.status(201).json({ token, user: userPublic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = getDb();
    const snap = await db.collection('users').where('email', '==', email).get();
    if (snap.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = snap.docs[0].data();
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...userPublic } = user;
    res.json({ token, user: userPublic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
