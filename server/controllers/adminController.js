const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { present } = require('./bookingController');

// GET /api/admin/bookings (capped at 1000 most recent; the UI filters client-side)
exports.allBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .sort({ createdAt: -1 }).limit(1000)
    .populate('userId', 'name email')
    .populate('roomId', 'roomNumber type');
  res.json({ bookings: bookings.map(present) });
});

// GET /api/admin/users
exports.allUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }); // password is select:false
  res.json({ users });
});

// GET /api/admin/dashboard -- failed payment attempts are not counted as bookings.
exports.dashboard = asyncHandler(async (req, res) => {
  const real = { paymentStatus: { $ne: 'failed' } };
  const [totalRooms, totalCustomers, totalBookings, activeBookings, cancelledBookings] = await Promise.all([
    Room.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'customer' }),
    Booking.countDocuments(real),
    Booking.countDocuments({ status: 'booked' }),
    Booking.countDocuments({ ...real, status: 'cancelled' }),
  ]);
  res.json({ stats: { totalRooms, totalCustomers, totalBookings, activeBookings, cancelledBookings } });
});
