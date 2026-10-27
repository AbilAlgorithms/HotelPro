const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    guestName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    fromDate: { type: Date, required: true }, // check-in, UTC midnight
    toDate: { type: Date, required: true },   // check-out, UTC midnight (the night of toDate is NOT booked)
    totalDays: { type: Number, required: true, min: 1 },     // computed by the server
    totalAmount: { type: Number, required: true, min: 0 },   // computed by the server
    status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    paymentReference: { type: String },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// Support queries by user, by room + dates + status (availability), and by status.
bookingSchema.index({ userId: 1, createdAt: -1 });
bookingSchema.index({ roomId: 1, status: 1, fromDate: 1, toDate: 1 });
bookingSchema.index({ status: 1, paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
