require('dotenv').config();
const express = require('express');
const cors = require('cors');
const locationRoutes = require('./routes/locations');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ service: 'location-service', status: 'ok' }));
app.use('/locations', locationRoutes);

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Location service running on port ${PORT}`));
