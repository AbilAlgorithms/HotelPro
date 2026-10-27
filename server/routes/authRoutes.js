const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Slow down brute-force and mass sign-ups.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', protect, me);

module.exports = router;
