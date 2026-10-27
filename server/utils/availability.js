const Booking = require('../models/Booking');
const { overlapQuery } = require('./bookingUtils');

// Map of roomId(string) -> number of active bookings overlapping [from, to).
async function overlapCounts(from, to, roomIds) {
  const rows = await Booking.aggregate([
    { $match: { ...overlapQuery(from, to), roomId: { $in: roomIds } } },
    { $group: { _id: '$roomId', n: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.n]));
}

module.exports = { overlapCounts };
