// Entry point — wires up Express, connects the database, and mounts all routes.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const { connectDatabase } = require('./config/db');
const store = require('./services/dataStore');
const jsonStore = require('./services/jsonStore');
const { seedIfEmpty } = require('./seed');

async function startServer() {
  await connectDatabase();

  // The JSON store keeps data in a file, so load it once at boot.
  // The very first boot also creates a demo account with 70 days of history,
  // so the prototype is instantly explorable.
  if (store.mode === 'json') {
    jsonStore.load();
    await seedIfEmpty();
  }

  const app = express();
  app.use(cors());
  app.use(express.json());

  // Simple health check — handy for verifying the API is alive.
  app.get('/api/health', (req, res) => res.json({ ok: true, mode: store.mode }));

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/tasks', require('./routes/tasks'));
  app.use('/api/plans', require('./routes/plans'));
  app.use('/api/stats', require('./routes/stats'));

  // Central error handler: every thrown error ends up here as clean JSON.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[error]', err.message);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Something went wrong on our side.' });
  });

  // In production (after `npm run build` inside client/) also serve the built app.
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(clientDist, 'index.html'));
      }
      next();
    });
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`[server] Ascend API listening on http://localhost:${port}`);
    console.log(`[server] Data mode: ${store.mode}${store.mode === 'json' ? ' (zero-setup demo mode)' : ''}`);
  });
}

startServer().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  process.exit(1);
});
