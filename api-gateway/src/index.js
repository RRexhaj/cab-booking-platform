require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

const SERVICES = {
  customer: process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3001',
  booking:  process.env.BOOKING_SERVICE_URL  || 'http://localhost:3002',
  payment:  process.env.PAYMENT_SERVICE_URL  || 'http://localhost:3003',
  fare:     process.env.FARE_SERVICE_URL     || 'http://localhost:3004',
  location: process.env.LOCATION_SERVICE_URL || 'http://localhost:3005',
};

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers['x-user-id'] = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// app.all preserves the full req.url — pathRewrite strips the /api prefix
// so /api/auth/login → /auth/login at the customer service
function makeProxy(target) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    on: {
      error: (err, req, res) => {
        res.status(502).json({ error: 'Service unavailable', details: err.message });
      },
    },
  });
}

app.get('/health', (_, res) => res.json({ gateway: 'ok', services: SERVICES }));

// Public routes
app.all(['/api/auth', '/api/auth/*'], makeProxy(SERVICES.customer));

// Protected routes — array covers both root and sub-paths
app.all(['/api/users',     '/api/users/*'],     authMiddleware, makeProxy(SERVICES.customer));
app.all(['/api/bookings',  '/api/bookings/*'],  authMiddleware, makeProxy(SERVICES.booking));
app.all(['/api/payments',  '/api/payments/*'],  authMiddleware, makeProxy(SERVICES.payment));
app.all(['/api/locations', '/api/locations/*'], authMiddleware, makeProxy(SERVICES.location));
app.all(['/api/fare',      '/api/fare/*'],      authMiddleware, makeProxy(SERVICES.fare));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
