require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookings');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ service: 'booking-service', status: 'ok' }));
app.use('/bookings', bookingRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Booking service running on port ${PORT}`));
