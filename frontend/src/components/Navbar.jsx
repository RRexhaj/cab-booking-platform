import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/bookings',  label: 'My Bookings' },
  { to: '/locations', label: 'Locations' },
  { to: '/payments',  label: 'Payments' },
  { to: '/inbox',     label: 'Inbox' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <nav className="bg-yellow-400 shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/dashboard" className="font-bold text-xl text-gray-900">CabBook</Link>
        <div className="flex items-center gap-4">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium ${pathname === to ? 'text-gray-900 underline' : 'text-gray-700 hover:text-gray-900'}`}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="text-sm font-medium text-red-700 hover:text-red-900 ml-4"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
