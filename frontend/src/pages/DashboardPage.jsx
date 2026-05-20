import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [currentBookings, setCurrentBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/api/bookings/current').then(d => setCurrentBookings(d.bookings)).catch(() => {});
    api.get('/api/users/notifications').then(d => setNotifications(d.notifications)).catch(() => {});
  }, []);

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800">
          Welcome back, {user.firstName}!
        </h2>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        {user.discountAvailable && (
          <span className="inline-block mt-3 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
            10% discount available on your next ride
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Current Bookings" value={currentBookings.length} to="/bookings" />
        <StatCard label="Unread Notifications" value={unread} to="/inbox" />
        <div
          className="bg-yellow-400 rounded-lg shadow p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-500 transition"
          onClick={() => window.location.href = '/bookings/new'}
        >
          <span className="text-2xl font-bold text-gray-900">+</span>
          <span className="text-sm font-semibold text-gray-900 mt-1">Book a Ride</span>
        </div>
      </div>

      {currentBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-3">Upcoming Rides</h3>
          <ul className="space-y-2">
            {currentBookings.slice(0, 3).map(b => (
              <li key={b.id} className="flex justify-between text-sm text-gray-600 border-b pb-2">
                <span>{b.startLocation} → {b.endLocation}</span>
                <span>{b.date} {b.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, to }) {
  return (
    <Link to={to} className="bg-white rounded-lg shadow p-5 flex flex-col items-center justify-center hover:shadow-md transition">
      <span className="text-3xl font-bold text-yellow-500">{value}</span>
      <span className="text-sm text-gray-500 mt-1 text-center">{label}</span>
    </Link>
  );
}
