import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ name: '', address: '' });
  const [weather, setWeather] = useState({});
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', address: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get('/api/locations').catch(() => ({ locations: [] }));
    setLocations(data.locations);
  }

  async function addLocation(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/locations', form);
      setForm({ name: '', address: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteLocation(id) {
    await api.del(`/api/locations/${id}`).catch(() => {});
    load();
  }

  async function saveEdit(id) {
    await api.put(`/api/locations/${id}`, editForm).catch(() => {});
    setEditId(null);
    load();
  }

  async function getWeather(id) {
    try {
      const data = await api.get(`/api/locations/${id}/weather`);
      setWeather(prev => ({ ...prev, [id]: data.weather }));
    } catch (err) {
      setWeather(prev => ({ ...prev, [id]: { error: err.message } }));
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800">Favourite Locations</h2>

      <form onSubmit={addLocation} className="bg-white rounded-lg shadow p-5 space-y-3">
        <h3 className="font-semibold text-gray-700">Add Location</h3>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input
          type="text" placeholder="Name (e.g. Home)" required
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="text" placeholder="Address / City" required
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
        />
        <button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded text-sm transition">
          Add
        </button>
      </form>

      {locations.length === 0 ? (
        <p className="text-gray-400 text-sm">No saved locations yet.</p>
      ) : (
        <ul className="space-y-3">
          {locations.map(loc => (
            <li key={loc.id} className="bg-white rounded-lg shadow p-5 space-y-2">
              {editId === loc.id ? (
                <div className="space-y-2">
                  <input
                    className="w-full border rounded px-3 py-1 text-sm"
                    value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                  <input
                    className="w-full border rounded px-3 py-1 text-sm"
                    value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(loc.id)} className="text-xs bg-yellow-400 px-3 py-1 rounded font-medium">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs border px-3 py-1 rounded">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{loc.name}</p>
                      <p className="text-sm text-gray-500">{loc.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(loc.id); setEditForm({ name: loc.name, address: loc.address }); }} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => deleteLocation(loc.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                      <button onClick={() => getWeather(loc.id)} className="text-xs text-green-600 hover:underline">Weather</button>
                    </div>
                  </div>
                  {weather[loc.id] && (
                    <div className="bg-blue-50 rounded p-3 text-xs text-gray-700 mt-2">
                      {weather[loc.id].error ? (
                        <p className="text-red-500">{weather[loc.id].error}</p>
                      ) : (
                        <>
                          <p className="font-semibold mb-1">{weather[loc.id].city?.name}, {weather[loc.id].city?.country}</p>
                          {weather[loc.id].list?.slice(0, 3).map((item, i) => (
                            <p key={i}>
                              {new Date(item.dt * 1000).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}:
                              {' '}{item.weather?.[0]?.description}, {Math.round(item.main?.temp - 273.15)}°C
                            </p>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
