// A tiny JSON-file database used when MongoDB is not configured (demo mode).
// All data lives in server/data/ascend-data.json — easy to inspect, easy to
// reset (just delete the file and restart the server for a fresh demo).
//
// It exposes the exact same small API as the MongoDB backend in mongoStore.js:
//   create, findById, findOne, find, countWhere, updateById, updateWhere,
//   deleteById, deleteWhere
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'ascend-data.json');

let db = { users: [], tasks: [], plans: [], meta: { nextId: 1 } };
let writeQueued = false;

function load() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log(`[jsonStore] Loaded ${db.users.length} users, ${db.tasks.length} tasks, ${db.plans.length} plans.`);
    }
  } catch (err) {
    console.error('[jsonStore] Could not read data file, starting fresh:', err.message);
  }
}

function saveNow() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

// Group several saves happening in the same moment into a single file write.
function saveSoon() {
  if (writeQueued) return;
  writeQueued = true;
  setTimeout(() => {
    writeQueued = false;
    try {
      saveNow();
    } catch (err) {
      console.error('[jsonStore] Failed to save:', err.message);
    }
  }, 25);
}

function newId(prefix) {
  const id = `${prefix}_${db.meta.nextId}`;
  db.meta.nextId += 1;
  return id;
}

// Supports the handful of query operators this app needs:
// plain equality plus $gte, $gt, $lte, $lt, $ne, $in.
function matches(doc, query) {
  return Object.keys(query).every((field) => {
    const expected = query[field];
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      return Object.keys(expected).every((op) => {
        const actual = doc[field];
        if (op === '$gte') return actual >= expected.$gte;
        if (op === '$gt') return actual > expected.$gt;
        if (op === '$lte') return actual <= expected.$lte;
        if (op === '$lt') return actual < expected.$lt;
        if (op === '$ne') return actual !== expected.$ne;
        if (op === '$in') return expected.$in.includes(actual);
        return false;
      });
    }
    return doc[field] === expected;
  });
}

// Return copies so callers can never mutate the in-memory database by accident.
function clone(value) {
  return value === undefined ? null : JSON.parse(JSON.stringify(value));
}

function makeCollection(name, prefix) {
  const collection = {
    async create(fields) {
      const now = new Date().toISOString();
      const doc = { _id: newId(prefix), createdAt: now, updatedAt: now, ...fields };
      db[name].push(doc);
      saveSoon();
      return clone(doc);
    },
    async findById(id) {
      return clone(db[name].find((doc) => doc._id === id));
    },
    async findOne(query) {
      return clone(db[name].find((doc) => matches(doc, query)));
    },
    async find(query = {}, { sort = 'createdAt' } = {}) {
      const found = db[name].filter((doc) => matches(doc, query));
      // Array.prototype.sort is stable, so equal keys keep insertion order.
      found.sort((a, b) => String(a[sort]).localeCompare(String(b[sort])));
      return clone(found);
    },
    async countWhere(query = {}) {
      return db[name].filter((doc) => matches(doc, query)).length;
    },
    async updateById(id, patch) {
      const doc = db[name].find((d) => d._id === id);
      if (!doc) return null;
      Object.assign(doc, patch, { updatedAt: new Date().toISOString() });
      saveSoon();
      return clone(doc);
    },
    async updateWhere(query, patch) {
      let count = 0;
      db[name].forEach((doc) => {
        if (matches(doc, query)) {
          Object.assign(doc, patch, { updatedAt: new Date().toISOString() });
          count += 1;
        }
      });
      if (count > 0) saveSoon();
      return count;
    },
    async deleteById(id) {
      const before = db[name].length;
      db[name] = db[name].filter((doc) => doc._id !== id);
      if (db[name].length !== before) {
        saveSoon();
        return true;
      }
      return false;
    },
    async deleteWhere(query) {
      const before = db[name].length;
      db[name] = db[name].filter((doc) => !matches(doc, query));
      const removed = before - db[name].length;
      if (removed > 0) saveSoon();
      return removed;
    },
  };
  return collection;
}

const users = makeCollection('users', 'usr');
// Login needs to read the password hash; it lives directly on the record here.
users.findByEmailWithPassword = async (email) => clone(db.users.find((doc) => doc.email === email));

const tasks = makeCollection('tasks', 'tsk');
const plans = makeCollection('plans', 'pln');

module.exports = { load, saveNow, users, tasks, plans };
