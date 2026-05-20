const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

// Convert a location name to lat/lng using OpenStreetMap Nominatim (free, no key needed)
async function geocode(location) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CabBooking-Assignment/1.0' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not find location: "${location}"`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// GET /fare?from=&to=
router.get('/', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to query params are required' });
    }

    // Geocode both locations
    const [dep, arr] = await Promise.all([geocode(from), geocode(to)]);

    const response = await fetch(
      `https://taxi-fare-calculator.p.rapidapi.com/search-geo?dep_lat=${dep.lat}&dep_lng=${dep.lng}&arr_lat=${arr.lat}&arr_lng=${arr.lng}`,
      {
        headers: {
          'x-rapidapi-host': 'taxi-fare-calculator.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: 'Fare API error', details: text });
    }

    const fareData = await response.json();
    res.json({ from, to, dep, arr, fareData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
