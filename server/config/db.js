const mongoose = require('mongoose');

// The server starts only after this resolves; on failure we exit non-zero.
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    console.error('Check that MongoDB is running and MONGO_URI in server/.env is correct.');
    process.exit(1);
  }
}

module.exports = connectDB;
