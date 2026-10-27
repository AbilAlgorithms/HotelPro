const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { ROOM_TYPES } = Room;
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateStayDates, isObjectId, todayUTC } = require('../utils/bookingUtils');
const { overlapCounts } = require('../utils/availability');

// Server-side validation (the client repeats it only for convenience).
function parseRoomBody(body) {
  const errors = [];
  const roomNumber = typeof body.roomNumber === 'string' || typeof body.roomNumber === 'number' ? String(body.roomNumber).trim() : '';
  const type = body.type;
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const rent = Number(body.rent);
  const count = Number(body.count);
  let amenities = body.amenities;
  if (typeof amenities === 'string') amenities = amenities.split(',');
  if (amenities === undefined) amenities = [];
  const photos = body.photos === undefined ? [] : body.photos;

  if (!roomNumber || roomNumber.length > 20) errors.push('Room number is required (max 20 characters).');
  if (!ROOM_TYPES.includes(type)) errors.push(`Room type must be one of: ${ROOM_TYPES.join(', ')}.`);
  if (description.length < 10 || description.length > 1000) errors.push('Description must be 10-1000 characters.');
  if (!Number.isFinite(rent) || rent <= 0) errors.push('Rent per night must be a positive number.');
  if (!Number.isInteger(count) || count < 1) errors.push('Inventory count must be a positive whole number.');
  if (!Array.isArray(amenities) || amenities.some((a) => typeof a !== 'string')) errors.push('Amenities must be a list of text values.');
  if (!Array.isArray(photos)) errors.push('Photos must be a list.');
  if (errors.length) return { errors };
  return {
    data: {
      roomNumber, type, description, rent, count,
      amenities: [...new Set(amenities.map((a) => a.trim()).filter(Boolean))].slice(0, 20),
      photos,
    },
  };
}

// GET /api/rooms?checkIn=&checkOut=&type=
exports.listRooms = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, type } = req.query;
  const filter = { isActive: true };
  if (type !== undefined) {
    if (!ROOM_TYPES.includes(type)) return res.status(400).json({ message: 'Unknown room type.' });
    filter.type = type;
  }
  const hasDates = checkIn !== undefined || checkOut !== undefined;
  let stay = null;
  if (hasDates) {
    stay = validateStayDates(checkIn, checkOut);
    if (stay.error) return res.status(400).json({ message: stay.error });
  }
  const rooms = await Room.find(filter).sort({ rent: 1 }).lean();
  if (!stay) return res.json({ rooms: rooms.map((r) => ({ ...r, availableUnits: null })) });

  const counts = await overlapCounts(stay.from, stay.to, rooms.map((r) => r._id));
  const available = rooms
    .map((r) => ({ ...r, availableUnits: Math.max(0, r.count - (counts.get(String(r._id)) || 0)) }))
    .filter((r) => r.availableUnits > 0);
  res.json({ rooms: available, nights: stay.nights, checkIn, checkOut });
});

// GET /api/rooms/:id (optionally with dates to include availableUnits)
exports.getRoom = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid room id.' });
  const room = await Room.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!room) return res.status(404).json({ message: 'Room not found.' });
  room.availableUnits = null;
  const { checkIn, checkOut } = req.query;
  if (checkIn !== undefined || checkOut !== undefined) {
    const stay = validateStayDates(checkIn, checkOut);
    if (stay.error) return res.status(400).json({ message: stay.error });
    const counts = await overlapCounts(stay.from, stay.to, [room._id]);
    room.availableUnits = Math.max(0, room.count - (counts.get(String(room._id)) || 0));
  }
  res.json({ room });
});

// POST /api/rooms (admin)
exports.createRoom = asyncHandler(async (req, res) => {
  const { errors, data } = parseRoomBody(req.body);
  if (errors) return res.status(400).json({ message: errors.join(' '), errors });
  const room = await Room.create(data);
  res.status(201).json({ room });
});

// PUT /api/rooms/:id (admin)
exports.updateRoom = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid room id.' });
  const { errors, data } = parseRoomBody(req.body);
  if (errors) return res.status(400).json({ message: errors.join(' '), errors });
  const room = await Room.findOne({ _id: req.params.id, isActive: true });
  if (!room) return res.status(404).json({ message: 'Room not found.' });
  Object.assign(room, data);
  await room.save(); // runs schema validators
  res.json({ room });
});

// DELETE /api/rooms/:id (admin)
// - Active future bookings -> blocked (409).
// - Only past/cancelled history -> room is archived (hidden) so booking records stay valid.
// - No bookings at all -> hard delete.
exports.deleteRoom = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid room id.' });
  const room = await Room.findOne({ _id: req.params.id, isActive: true });
  if (!room) return res.status(404).json({ message: 'Room not found.' });

  const upcoming = await Booking.countDocuments({ roomId: room._id, status: 'booked', toDate: { $gt: todayUTC() } });
  if (upcoming > 0) {
    return res.status(409).json({ message: `Cannot delete: ${upcoming} active booking(s) still reference this room. Cancel them first or reduce its inventory instead.` });
  }
  const history = await Booking.countDocuments({ roomId: room._id });
  if (history > 0) {
    room.isActive = false;
    await room.save();
    return res.json({ message: 'Room archived. It has booking history, so the record was kept and hidden from listings.', archived: true });
  }
  await room.deleteOne();
  res.json({ message: 'Room deleted.', archived: false });
});

// POST /api/rooms/upload (admin) -> returns public paths
exports.uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ message: 'Select at least one image to upload.' });
  res.status(201).json({ photos: req.files.map((f) => `/uploads/${f.filename}`) });
});
