const router = require('express').Router();
const c = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('customer'), c.createBooking);
router.get('/my', protect, authorize('customer'), c.myBookings);
router.patch('/:id/cancel', protect, authorize('customer', 'admin'), c.cancelBooking);

module.exports = router;
