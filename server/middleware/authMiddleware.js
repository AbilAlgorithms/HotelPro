const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('./errorMiddleware');

// Verifies the Bearer token, then loads the user from the DB so deleted users or
// changed roles take effect immediately (the role in the token is never trusted alone).
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required. Please log in.' });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid authentication token.';
    return res.status(401).json({ message: msg });
  }
  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ message: 'Account no longer exists.' });
  req.user = user;
  next();
});

module.exports = { protect };
