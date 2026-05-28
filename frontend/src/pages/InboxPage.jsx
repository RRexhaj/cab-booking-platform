import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function InboxPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get('/api/users/notifications').catch(() => ({ notifications: [] }));
    setNotifications(data.notifications);
    setLoading(false);
  }

  async function markRead(id) {
    await api.patch(`/api/users/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  const icon = type => type === 'discount' ? '🎉' : type === 'cab_ready' ? '🚕' : '🔔';

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Inbox</h2>
        <button onClick={load} className="text-sm text-yellow-700 border border-yellow-400 px-3 py-1 rounded hover:bg-yellow-50 transition">Refresh</button>
      </div>
      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : notifications.length === 0 ? (
        <p className="text-gray-400 text-sm">No notifications yet.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map(n => (
            <li
              key={n.id}
              className={`rounded-lg shadow p-5 flex gap-4 items-start ${n.read ? 'bg-white' : 'bg-yellow-50 border border-yellow-200'}`}
            >
              <span className="text-2xl">{icon(n.type)}</span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  className="text-xs text-yellow-700 hover:underline shrink-0"
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
