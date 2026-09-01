const mongoose = require('mongoose');

/**
 * Connects to MongoDB (Atlas) using the URI in MONGO_URI.
 * Exits the process on failure so the app never runs in a half-connected state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
