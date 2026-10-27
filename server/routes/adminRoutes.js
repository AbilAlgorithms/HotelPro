const router = require('express').Router();
const c = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin')); // every admin route requires an admin
router.get('/bookings', c.allBookings);
router.get('/users', c.allUsers);
router.get('/dashboard', c.dashboard);

module.exports = router;
