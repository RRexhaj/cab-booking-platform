import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/payments')
      .then(d => setPayments(d.payments))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Payment History</h2>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-400 text-sm">No payments yet.</p>
      ) : (
        <ul className="space-y-3">
          {payments.map(p => (
            <li key={p.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-800">€{p.total.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Booking: {p.bookingId}</p>
                  <p className="text-xs text-gray-500">
                    Base fare: €{p.cabFare} · Cab ×{p.cabMultiplier} · Time ×{p.daytimeMultiplier} · Pax ×{p.passengersMultiplier}
                    {p.discountApplied && ' · Discount ×0.9'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">{p.status}</span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
