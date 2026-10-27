const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { EMAIL_RE, PHONE_RE } = User;
const { asyncHandler } = require('../middleware/errorMiddleware');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

const str = (v) => (typeof v === 'string' ? v.trim() : '');
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12); // equalises timing for unknown emails

// POST /api/auth/register  (public) -> always creates a "customer"
exports.register = asyncHandler(async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const phone = str(req.body.phone);
  const { password, confirmPassword } = req.body;
  const errors = [];
  if (name.length < 2 || name.length > 80) errors.push('Name must be 2-80 characters.');
  if (!EMAIL_RE.test(email)) errors.push('Enter a valid email address.');
  if (!PHONE_RE.test(phone)) errors.push('Enter a valid phone number (7-15 digits, optional +).');
  if (typeof password !== 'string' || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.push('Password must be at least 8 characters and include a letter and a number.');
  }
  if (password !== confirmPassword) errors.push('Passwords do not match.');
  if (errors.length) return res.status(400).json({ message: errors.join(' '), errors });

  // SECURITY: role is never read from the request body.
  const user = await User.create({ name, email, phone, password, role: 'customer' });
  res.status(201).json({ message: 'Registration successful. Please log in.', user });
});

// POST /api/auth/login  (public)
exports.login = asyncHandler(async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  const password = req.body.password;
  if (!email || typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const user = await User.findOne({ email }).select('+password');
  const ok = user ? await user.matchPassword(password) : (await bcrypt.compare(password, DUMMY_HASH), false);
  if (!ok) return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json({ token: signToken(user), user }); // toJSON strips the hash
});

// GET /api/auth/me
exports.me = (req, res) => res.json({ user: req.user });
