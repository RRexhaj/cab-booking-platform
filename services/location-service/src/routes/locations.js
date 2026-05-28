const express = require('express');
const fetch = require('node-fetch');
const { getDb } = require('../db/firebase');

const router = express.Router();

// GET /locations – get all saved locations for user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const db = getDb();
    const snap = await db.collection('locations').where('userId', '==', userId).get();
    res.json({ locations: snap.docs.map(d => d.data()) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /locations – add a favourite location
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { name, address } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'name and address are required' });
    }

    const db = getDb();
    const ref = db.collection('locations').doc();
    const location = { id: ref.id, userId, name, address, createdAt: new Date().toISOString() };
    await ref.set(location);
    res.status(201).json({ location });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /locations/:id – update a location
router.put('/:id', async (req, res) => {
  try {
    const { name, address } = req.body;
    const db = getDb();
    await db.collection('locations').doc(req.params.id).update({ name, address });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /locations/:id – remove a location
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    await db.collection('locations').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /locations/:id/weather – 3-day forecast for a saved location
router.get('/:id/weather', async (req, res) => {
  try {
    const db = getDb();
    const doc = await db.collection('locations').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Location not found' });

    const { address } = doc.data();
    const response = await fetch(
      `https://weather-api167.p.rapidapi.com/api/weather/forecast?place=${encodeURIComponent(address)}&cnt=3&units=metric&type=three_hour&mode=json&lang=en`,
      {
        headers: {
          'x-rapidapi-host': 'weather-api167.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Weather API error', details: text });
    }

    const weather = await response.json();
    res.json({ location: doc.data(), weather });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
