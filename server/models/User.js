const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PHONE_RE = /^\+?[0-9][0-9\s-]{6,14}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true,
      match: [EMAIL_RE, 'Enter a valid email address'],
    },
    // select:false keeps the hash out of queries unless explicitly requested.
    password: { type: String, required: [true, 'Password is required'], select: false },
    phone: { type: String, required: [true, 'Phone number is required'], trim: true, match: [PHONE_RE, 'Enter a valid phone number'] },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  },
  { timestamps: true }
);

// Hash only when the password changed. Raw length rules are enforced in the controller.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Never serialise the hash.
userSchema.set('toJSON', {
  transform: (_doc, ret) => { delete ret.password; delete ret.__v; return ret; },
});

module.exports = mongoose.model('User', userSchema);
module.exports.PHONE_RE = PHONE_RE;
module.exports.EMAIL_RE = EMAIL_RE;
