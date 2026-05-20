const express = require('express');
const fetch = require('node-fetch');
const { getDb } = require('../db/firebase');
const bookingBus = require('../events/bookingEvents');

const router = express.Router();

// POST /bookings  – create a new booking
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { startLocation, endLocation, date, time, passengers, cabType } = req.body;

    if (!startLocation || !endLocation || !date || !time || !passengers || !cabType) {
      return res.status(400).json({ error: 'All booking fields are required' });
    }
    if (!['Economic', 'Premium', 'Executive'].includes(cabType)) {
      return res.status(400).json({ error: 'cabType must be Economic, Premium, or Executive' });
    }
    if (passengers > 8) {
      return res.status(400).json({ error: 'Maximum 8 passengers allowed' });
    }

    const db = getDb();
    const ref = db.collection('bookings').doc();
    const booking = {
      id: ref.id,
      userId,
      startLocation,
      endLocation,
      date,
      time,
      passengers: Number(passengers),
      cabType,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    await ref.set(booking);

    // Count completed bookings for this user (Task 5 trigger)
    const countSnap = await db
      .collection('bookings')
      .where('userId', '==', userId)
      .where('status', '==', 'confirmed')
      .get();
    const bookingCount = countSnap.size;

    // Emit domain event – listener handles discount notification
    bookingBus.emit('booking.completed', { userId, bookingCount });

    // Task 6: schedule "cab ready" notification via QStash after 3 minutes
    if (process.env.QSTASH_TOKEN) {
      const callbackUrl = `${process.env.CUSTOMER_SERVICE_URL}/users/notifications`;
      await fetch('https://qstash.upstash.io/v2/publish/' + encodeURIComponent(callbackUrl), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          'Content-Type': 'application/json',
          'Upstash-Delay': '3m',
        },
        body: JSON.stringify({
          userId,
          type: 'cab_ready',
          message: `Your cab is ready! Driver is on the way for your ride from ${startLocation} to ${endLocation}.`,
        }),
      });
    }

    res.status(201).json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /bookings/current – future bookings
router.get('/current', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const db = getDb();
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const snap = await db
      .collection('bookings')
      .where('userId', '==', userId)
      .where('date', '>=', now)
      .orderBy('date', 'asc')
      .get();

    res.json({ bookings: snap.docs.map(d => d.data()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /bookings/past – historical bookings
router.get('/past', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const db = getDb();
    const now = new Date().toISOString().split('T')[0];

    const snap = await db
      .collection('bookings')
      .where('userId', '==', userId)
      .where('date', '<', now)
      .orderBy('date', 'desc')
      .get();

    res.json({ bookings: snap.docs.map(d => d.data()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
