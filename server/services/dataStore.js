// The one data layer every controller talks to.
//
// The backend is picked ONCE, at startup, based on the environment:
//   - MONGODB_URI is set  → MongoDB (via Mongoose models)
//   - MONGODB_URI empty   → JSON file store (zero setup, great for demos)
//
// Both backends expose the same functions, so controllers stay simple:
//   const { users, tasks, plans } = require('../services/dataStore');
//   await tasks.find({ userId, date: '2026-09-06' });
const useMongo = Boolean((process.env.MONGODB_URI || '').trim());
const backend = useMongo ? require('./mongoStore') : require('./jsonStore');

module.exports = {
  mode: useMongo ? 'mongodb' : 'json',
  users: backend.users,
  tasks: backend.tasks,
  plans: backend.plans,
};
