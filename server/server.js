// Single backend entry point: `npm start` / `npm run dev`.
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { validateEnv } = require('./config/env');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

validateEnv();
const app = express();

// crossOriginResourcePolicy relaxed so the Vite client (another origin) can display /uploads images.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { index: false, dotfiles: 'deny' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use(notFound);
app.use(errorHandler);

(async () => {
  await connectDB(); // exits the process if the database is unreachable
  const port = process.env.PORT || 8001;
  app.listen(port, () => console.log(`Roomly API listening on http://localhost:${port}`));
})();
