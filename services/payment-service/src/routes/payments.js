const express = require('express');
const fetch = require('node-fetch');
const { getDb } = require('../db/firebase');

const router = express.Router();

const CAB_MULTIPLIERS = { Economic: 1, Premium: 1.2, Executive: 1.4 };
const DISCOUNT_MULTIPLIER = 0.9;

function getDaytimeMultiplier(time) {
  // time format: "HH:MM"
  const [hours] = time.split(':').map(Number);
  return hours >= 8 ? 1 : 1.2; // midnight–8am is 1.2
}

function getPassengersMultiplier(passengers) {
  if (passengers <= 4) return 1;
  if (passengers <= 8) return 2;
  return null; // not allowed
}

// POST /payments  – process payment for a booking
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { bookingId, cabFare, cabType, time, passengers } = req.body;

    if (!bookingId || cabFare == null || !cabType || !time || passengers == null) {
      return res.status(400).json({ error: 'bookingId, cabFare, cabType, time and passengers are required' });
    }

    const passMult = getPassengersMultiplier(Number(passengers));
    if (passMult === null) return res.status(400).json({ error: 'More than 8 passengers not allowed' });

    // Check if user has discount
    const db = getDb();
    const userDoc = await db.collection('users').doc(userId).get();
    const discountAvailable = userDoc.exists && userDoc.data().discountAvailable;
    const discountMult = discountAvailable ? DISCOUNT_MULTIPLIER : 1;

    const total =
      Number(cabFare) *
      (CAB_MULTIPLIERS[cabType] || 1) *
      getDaytimeMultiplier(time) *
      passMult *
      discountMult;

    const ref = db.collection('payments').doc();
    const payment = {
      id: ref.id,
      userId,
      bookingId,
      cabFare: Number(cabFare),
      cabType,
      time,
      passengers: Number(passengers),
      cabMultiplier: CAB_MULTIPLIERS[cabType] || 1,
      daytimeMultiplier: getDaytimeMultiplier(time),
      passengersMultiplier: passMult,
      discountApplied: discountAvailable,
      discountMultiplier: discountMult,
      total: Math.round(total * 100) / 100,
      status: 'paid',
      createdAt: new Date().toISOString(),
    };
    await ref.set(payment);

    res.status(201).json({ payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /payments  – payment history for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const db = getDb();
    const snap = await db
      .collection('payments')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    res.json({ payments: snap.docs.map(d => d.data()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
