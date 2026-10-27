const mongoose = require('mongoose');

const ROOM_TYPES = ['Single', 'Double', 'Deluxe', 'Suite'];

// Photos may be an uploaded path (/uploads/...) or an http(s) URL.
const photoOk = (p) => typeof p === 'string' && (/^\/uploads\/[\w./-]+$/.test(p) && !p.includes('..') || /^https?:\/\/\S+$/.test(p));

const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: [true, 'Room number is required'], unique: true, trim: true, maxlength: 20 },
    type: { type: String, required: [true, 'Room type is required'], enum: { values: ROOM_TYPES, message: 'Type must be one of: ' + ROOM_TYPES.join(', ') } },
    description: { type: String, required: [true, 'Description is required'], trim: true, minlength: 10, maxlength: 1000 },
    photos: { type: [String], default: [], validate: { validator: (arr) => arr.length <= 5 && arr.every(photoOk), message: 'Photos must be uploaded image paths or http(s) URLs (max 5)' } },
    rent: { type: Number, required: [true, 'Rent per night is required'], min: [1, 'Rent must be greater than 0'] },
    count: { type: Number, required: [true, 'Inventory count is required'], min: [1, 'Count must be at least 1'], validate: { validator: Number.isInteger, message: 'Count must be a whole number' } },
    amenities: { type: [String], default: [] },
    // Rooms with booking history are archived rather than deleted, so history stays consistent.
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ isActive: 1, type: 1, rent: 1 });

module.exports = mongoose.model('Room', roomSchema);
module.exports.ROOM_TYPES = ROOM_TYPES;
