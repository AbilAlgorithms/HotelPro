// Creates the initial administrator from ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD in server/.env.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.');
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 10 || ADMIN_PASSWORD.startsWith('replace_with')) {
    console.error('ADMIN_PASSWORD must be a real password of at least 10 characters (not the example value).');
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(existing.role === 'admin'
        ? `Admin ${email} already exists. Nothing changed.`
        : `A customer account already uses ${email}. Choose a different ADMIN_EMAIL; accounts are never silently promoted.`);
      process.exitCode = existing.role === 'admin' ? 0 : 1;
    } else {
      await User.create({ name: ADMIN_NAME, email, phone: '+910000000000', password: ADMIN_PASSWORD, role: 'admin' });
      console.log(`Admin account created for ${email}.`);
    }
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
