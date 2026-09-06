// Auth controller: register, login, current user, profile edits.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../services/dataStore');
const { publicUser, sameId } = require('../utils/serializers');
const asyncHandler = require('../utils/asyncHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'ascend-dev-secret-change-me';
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function signToken(userId) {
  return jwt.sign({ id: String(userId) }, JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ message: 'Please enter your name.' });
  }
  if (!email || !EMAIL_PATTERN.test(String(email))) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await store.users.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await store.users.create({
    name: String(name).trim(),
    email: normalizedEmail,
    password: passwordHash,
    level: 1,
    totalExp: 0,
    currentExp: 0,
    streak: 0,
    longestStreak: 0,
    awardedBonusKeys: [],
  });

  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = email
    ? await store.users.findByEmailWithPassword(String(email).toLowerCase().trim())
    : null;

  const passwordOk = user && password && (await bcrypt.compare(password, user.password));
  if (!passwordOk) {
    return res.status(401).json({ message: 'Incorrect email or password.' });
  }

  res.json({ token: signToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// PUT /api/auth/me — edit profile (name / email / password)
const updateMe = asyncHandler(async (req, res) => {
  const patch = {};

  if (req.body.name !== undefined) {
    if (String(req.body.name).trim().length < 2) {
      return res.status(400).json({ message: 'Please enter your name.' });
    }
    patch.name = String(req.body.name).trim();
  }

  if (req.body.email !== undefined) {
    const normalizedEmail = String(req.body.email).toLowerCase().trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    const clash = await store.users.findOne({ email: normalizedEmail });
    if (clash && !sameId(clash._id, req.user._id)) {
      return res.status(409).json({ message: 'That email is already in use.' });
    }
    patch.email = normalizedEmail;
  }

  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    patch.password = await bcrypt.hash(req.body.password, 10);
  }

  const updated = await store.users.updateById(req.user._id, patch);
  res.json({ user: publicUser(updated) });
});

module.exports = { register, login, me, updateMe };
