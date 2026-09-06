// Verifies the JWT on every protected request and loads the current user.
const jwt = require('jsonwebtoken');
const { users } = require('../services/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'ascend-dev-secret-change-me';

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Please log in to continue.' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await users.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Account not found. Please log in again.' });
    }

    req.user = user; // controllers can now use req.user safely
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

module.exports = { protect };
