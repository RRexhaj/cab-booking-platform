require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fareRoutes = require('./routes/fare');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ service: 'fare-estimation-service', status: 'ok' }));
app.use('/fare', fareRoutes);

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log(`Fare estimation service running on port ${PORT}`));
