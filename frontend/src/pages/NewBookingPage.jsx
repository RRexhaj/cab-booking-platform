import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const CAB_TYPES = ['Economic', 'Premium', 'Executive'];

export default function NewBookingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    startLocation: '', endLocation: '', date: '', time: '', passengers: 1, cabType: 'Economic',
  });
  const [fareData, setFareData] = useState(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function estimateFare() {
    if (!form.startLocation || !form.endLocation) {
      setError('Enter start and end locations first');
      return;
    }
    setFareLoading(true);
    setError('');
    try {
      const data = await api.get(
        `/api/fare?from=${encodeURIComponent(form.startLocation)}&to=${encodeURIComponent(form.endLocation)}&passengers=${form.passengers}`
      );
      setFareData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFareLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Create the booking
      const { booking } = await api.post('/api/bookings', form);

      // If we have a fare, process payment immediately
      if (fareData) {
        // Taxi fare API returns an array of options; grab total_price from the first
        const fareOptions = fareData.fareData;
        const baseFare =
          (Array.isArray(fareOptions) && fareOptions[0]?.total_price) ||
          fareOptions?.total_price ||
          fareOptions?.fare ||
          10;
        await api.post('/api/payments', {
          bookingId: booking.id,
          cabFare: baseFare,
          cabType: form.cabType,
          time: form.time,
          passengers: form.passengers,
        });
      }

      navigate('/bookings');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const field = (key, label, type = 'text', extra = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type} required
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Book a Ride</h2>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {field('startLocation', 'Pickup Location')}
        {field('endLocation', 'Drop-off Location')}
        <div className="grid grid-cols-2 gap-4">
          {field('date', 'Date', 'date')}
          {field('time', 'Time', 'time')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
          <input
            type="number" min="1" max="8" required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.passengers}
            onChange={e => setForm({ ...form, passengers: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cab Type</label>
          <select
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.cabType}
            onChange={e => setForm({ ...form, cabType: e.target.value })}
          >
            {CAB_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <button
          type="button" onClick={estimateFare} disabled={fareLoading}
          className="w-full border border-yellow-400 text-yellow-700 font-semibold py-2 rounded text-sm hover:bg-yellow-50 transition"
        >
          {fareLoading ? 'Estimating…' : 'Get Fare Estimate'}
        </button>

        {fareData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-gray-700">
            <p className="font-semibold">Fare Estimate</p>
            {Array.isArray(fareData.fareData)
            ? fareData.fareData.slice(0, 3).map((opt, i) => (
                <p key={i}>{opt.vehicle_type ?? `Option ${i + 1}`}: €{opt.total_price}</p>
              ))
            : <p>Base fare: €{fareData.fareData?.total_price ?? fareData.fareData?.fare ?? 'N/A'}</p>
          }
            <p className="text-xs text-gray-500 mt-1">Final price calculated at payment including cab type, time of day, and passenger multipliers.</p>
          </div>
        )}

        <button
          type="submit" disabled={submitting}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 rounded transition"
        >
          {submitting ? 'Booking…' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
