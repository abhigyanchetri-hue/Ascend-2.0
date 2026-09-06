// Database connection.
//
// Ascend supports two data modes:
//   1. MongoDB (via Mongoose) — used when MONGODB_URI is set in server/.env
//   2. Zero-setup JSON store — used when MONGODB_URI is empty (perfect for demos)
//
// The rest of the app does not care which mode is active; it talks to a tiny
// data layer in services/dataStore.js that hides the difference.
const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = (process.env.MONGODB_URI || '').trim();

  if (!uri) {
    console.log('[db] MONGODB_URI is empty → using the zero-setup JSON store.');
    return 'json';
  }

  try {
    await mongoose.connect(uri);
    console.log('[db] Connected to MongoDB.');
    return 'mongodb';
  } catch (err) {
    console.error('[db] Could not connect to MongoDB:', err.message);
    console.error('[db] Fix MONGODB_URI in server/.env, or clear it to use the JSON store.');
    throw err;
  }
}

module.exports = { connectDatabase };
