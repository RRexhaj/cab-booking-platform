import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function BookingsPage() {
  const [tab, setTab] = useState('current');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/bookings/${tab}`)
      .then(d => setBookings(d.bookings))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">My Bookings</h2>
        <Link
          to="/bookings/new"
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded text-sm transition"
        >
          + New Booking
        </Link>
      </div>

      <div className="flex gap-2">
        {['current', 'past'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded text-sm font-medium transition ${tab === t ? 'bg-yellow-400 text-gray-900' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >
            {t === 'current' ? 'Upcoming' : 'Past'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-400 text-sm">No {tab} bookings.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map(b => (
            <li key={b.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{b.startLocation} → {b.endLocation}</p>
                  <p className="text-sm text-gray-500 mt-1">{b.date} at {b.time} · {b.passengers} passenger{b.passengers > 1 ? 's' : ''}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.cabType === 'Executive' ? 'bg-purple-100 text-purple-700' : b.cabType === 'Premium' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {b.cabType}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
