const Booking = require('../models/Booking');
const Room = require('../models/Room');
const crypto = require('crypto');
const { PHONE_RE } = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateStayDates, overlapQuery, calcTotal, cancellationStatus, isObjectId } = require('../utils/bookingUtils');

const ROOM_FIELDS = 'roomNumber type photos rent';

// Adds server-computed cancellation info so the UI follows the same policy as the API.
function present(booking) {
  const obj = booking.toObject ? booking.toObject() : booking;
  const c = cancellationStatus(obj);
  return { ...obj, cancellable: c.allowed, cancelReason: c.reason };
}

// POST /api/bookings (customer)
// Order of operations: validate -> reserve (pending) -> re-verify capacity -> mock payment.
exports.createBooking = asyncHandler(async (req, res) => {
  const { roomId, fromDate, toDate, paymentOutcome = 'success' } = req.body;
  const guestName = typeof req.body.guestName === 'string' ? req.body.guestName.trim() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';

  const errors = [];
  if (!isObjectId(roomId)) errors.push('A valid room is required.');
  if (guestName.length < 2 || guestName.length > 80) errors.push('Guest name must be 2-80 characters.');
  if (!PHONE_RE.test(phone)) errors.push('Enter a valid phone number.');
  if (!['success', 'fail'].includes(paymentOutcome)) errors.push('Invalid payment outcome.');
  const stay = validateStayDates(fromDate, toDate);
  if (stay.error) errors.push(stay.error);
  if (errors.length) return res.status(400).json({ message: errors.join(' '), errors });

  const room = await Room.findOne({ _id: roomId, isActive: true });
  if (!room) return res.status(404).json({ message: 'Room not found.' });

  const soldOut = { message: 'Sorry, this room type is fully booked for the selected dates.' };
  if ((await Booking.countDocuments({ roomId: room._id, ...overlapQuery(stay.from, stay.to) })) >= room.count) {
    return res.status(409).json(soldOut);
  }

  // userId comes from the verified token; price and nights come from the DB/server only.
  const booking = await Booking.create({
    roomId: room._id, userId: req.user._id, guestName, phone,
    fromDate: stay.from, toDate: stay.to,
    totalDays: stay.nights, totalAmount: calcTotal(stay.nights, room.rent),
    status: 'booked', paymentStatus: 'pending',
  });

  // Re-check after inserting: if concurrent requests oversold the room, roll this one back.
  // (Without multi-document transactions this "insert, then verify" step is what prevents overbooking.)
  if ((await Booking.countDocuments({ roomId: room._id, ...overlapQuery(stay.from, stay.to) })) > room.count) {
    await Booking.deleteOne({ _id: booking._id });
    return res.status(409).json(soldOut);
  }

  // MOCK PAYMENT: no card data is ever received. The outcome is chosen on the demo checkout page.
  if (paymentOutcome === 'fail') {
    booking.status = 'cancelled'; // releases inventory
    booking.paymentStatus = 'failed';
    booking.cancelledAt = new Date();
    await booking.save();
    return res.status(402).json({ message: 'Demo payment failed. No booking was confirmed and you were not charged.', booking: present(booking) });
  }
  booking.paymentStatus = 'paid';
  booking.paymentReference = `MOCK-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  await booking.save();
  await booking.populate('roomId', ROOM_FIELDS);
  res.status(201).json({ message: 'Booking confirmed (demo payment).', booking: present(booking) });
});

// GET /api/bookings/my
exports.myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 }).populate('roomId', ROOM_FIELDS);
  res.json({ bookings: bookings.map(present) });
});

// PATCH /api/bookings/:id/cancel (owner or admin)
exports.cancelBooking = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid booking id.' });
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && String(booking.userId) !== String(req.user._id)) {
    return res.status(403).json({ message: 'You can only cancel your own bookings.' });
  }
  if (booking.status === 'cancelled') return res.status(409).json({ message: 'This booking is already cancelled.' });
  // Policy window applies to customers; administrators may cancel at any time.
  if (!isAdmin) {
    const c = cancellationStatus(booking);
    if (!c.allowed) return res.status(409).json({ message: c.reason });
  }
  // Atomic: only flips a booking that is still "booked", so double-clicks cannot cancel twice.
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: 'booked' },
    { status: 'cancelled', cancelledAt: new Date(), ...(booking.paymentStatus === 'paid' ? { paymentStatus: 'refunded' } : {}) },
    { new: true }
  ).populate('roomId', ROOM_FIELDS);
  if (!updated) return res.status(409).json({ message: 'This booking is already cancelled.' });
  res.json({ message: 'Booking cancelled.', booking: present(updated) });
});

exports.present = present;
