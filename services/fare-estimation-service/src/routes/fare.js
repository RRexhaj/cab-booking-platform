const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Convert a location name to lat/lng using Photon (free, OSM-based, cloud-friendly)
async function geocode(location) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(location)}&limit=1`;
  const res = await fetch(url, { headers: { 'User-Agent': 'CabBooking-Assignment/1.0' } });
  if (!res.ok) throw new Error(`Geocoding failed for "${location}": ${res.status}`);
  const data = await res.json();
  if (!data.features || !data.features.length) throw new Error(`Could not find location: "${location}"`);
  const [lng, lat] = data.features[0].geometry.coordinates;
  return { lat, lng };
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

    let fareData = null;
    if (response.ok) {
      const raw = await response.json();
      const journey = raw?.journey;
      if (journey?.fares?.length) {
        const parsed = journey.fares
          .filter(f => f.price_in_cents !== 'n/a' && f.price_in_cents != null)
          .map(f => ({
            vehicle_type: f.name,
            total_price: parseFloat((f.price_in_cents / 100).toFixed(2)),
            distance_km: journey.distance,
            duration_min: journey.duration,
          }));
        if (parsed.length) fareData = parsed;
      }
    }

    // Fallback: distance-based fare when API has no coverage for the region
    if (!fareData) {
      const km = haversineKm(dep.lat, dep.lng, arr.lat, arr.lng);
      const total_price = parseFloat((Math.max(5, km * 1.8) + 2).toFixed(2));
      fareData = [{ vehicle_type: 'Standard', total_price, distance_km: parseFloat(km.toFixed(2)) }];
    }

    res.json({ from, to, dep, arr, fareData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
