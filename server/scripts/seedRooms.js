// Optional: inserts four demo room listings if the rooms collection is empty.
require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('../models/Room');

const rooms = [
  { roomNumber: 'S-101', type: 'Single', description: 'A calm single room with a work desk, blackout curtains and a quiet courtyard view.', rent: 1800, count: 6, amenities: ['Wi-Fi', 'Air conditioning', 'Work desk', 'Tea & coffee'], photos: ['/uploads/seed/room-single.svg'] },
  { roomNumber: 'D-201', type: 'Double', description: 'A bright double room with a queen bed, seating nook and a large window onto the garden.', rent: 2900, count: 8, amenities: ['Wi-Fi', 'Air conditioning', 'Queen bed', 'Mini fridge', 'Breakfast'], photos: ['/uploads/seed/room-double.svg'] },
  { roomNumber: 'X-301', type: 'Deluxe', description: 'A spacious deluxe room with a king bed, rain shower and a private balcony.', rent: 4500, count: 4, amenities: ['Wi-Fi', 'Air conditioning', 'King bed', 'Balcony', 'Rain shower', 'Breakfast'], photos: ['/uploads/seed/room-deluxe.svg'] },
  { roomNumber: 'P-401', type: 'Suite', description: 'A top-floor suite with a separate lounge, dining table and sweeping views of the city.', rent: 8200, count: 2, amenities: ['Wi-Fi', 'Air conditioning', 'Lounge', 'Bathtub', 'City view', 'Breakfast'], photos: ['/uploads/seed/room-suite.svg'] },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    if (await Room.countDocuments()) console.log('Rooms already exist. Nothing inserted.');
    else { await Room.insertMany(rooms); console.log(`Inserted ${rooms.length} demo rooms.`); }
  } catch (err) { console.error('Seeding failed:', err.message); process.exitCode = 1; }
  finally { await mongoose.disconnect(); }
})();
