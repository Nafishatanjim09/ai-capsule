// index.js — AI Capsule server entrypoint.
// Serves the Express API and the built React app from a single origin, which
// is the simplest deployment shape for a JWT stored in an HttpOnly cookie
// (no CORS, no cross-site cookie configuration).

require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const capsuleRoutes = require('./routes/capsules');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

// Public health check — must stay public and unauthenticated.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// OAuth + session routes: GET /login, GET /auth/github/callback,
// GET /api/me, POST /api/logout.
app.use('/', authRoutes);

// Protected CRUD routes. requireAuth is applied inside routes/capsules.js.
app.use('/api/capsules', capsuleRoutes);

// Serve the built React app (client/dist) for everything else.
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA fallback: let React Router handle client-side routes like /dashboard.
// Anything under /api or /auth that reaches here is a genuine 404.
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AI Capsule server listening on port ${PORT}`);
});
