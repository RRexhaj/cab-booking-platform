require('dotenv').config();
const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ service: 'payment-service', status: 'ok' }));
app.use('/payments', paymentRoutes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Payment service running on port ${PORT}`));
