// Helpers for shaping data before it leaves the server.
const { expForLevel, levelTitle } = require('../services/expService');

// The version of a user that is safe/needed by the client.
// Never includes the password hash.
function publicUser(user) {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    level: user.level,
    totalExp: user.totalExp,
    currentExp: user.currentExp,
    streak: user.streak,
    longestStreak: user.longestStreak,
    // Extra "flavor" fields the UI shows next to the level:
    expForNextLevel: expForLevel(user.level),
    levelTitle: levelTitle(user.level),
    createdAt: user.createdAt,
  };
}

// Compares two ids as strings so it works in both MongoDB (ObjectIds)
// and JSON store (plain strings) modes.
function sameId(a, b) {
  return String(a) === String(b);
}

// Keeps EXP rewards in a sane range (1–500).
function clampExp(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(500, Math.max(1, Math.round(parsed)));
}

module.exports = { publicUser, sameId, clampExp };
