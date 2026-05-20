import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import NewBookingPage from './pages/NewBookingPage';
import LocationsPage from './pages/LocationsPage';
import PaymentsPage from './pages/PaymentsPage';
import InboxPage from './pages/InboxPage';

export default function App() {
  const isLoggedIn = !!localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <main className="max-w-5xl mx-auto px-4 py-8">
                <Routes>
                  <Route path="/"             element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard"    element={<DashboardPage />} />
                  <Route path="/bookings"     element={<BookingsPage />} />
                  <Route path="/bookings/new" element={<NewBookingPage />} />
                  <Route path="/locations"    element={<LocationsPage />} />
                  <Route path="/payments"     element={<PaymentsPage />} />
                  <Route path="/inbox"        element={<InboxPage />} />
                </Routes>
              </main>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
