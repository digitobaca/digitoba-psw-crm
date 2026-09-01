/**
 * One-off CLI script to create (or promote) the first admin user.
 * Registration is intentionally NOT exposed as a public API route, so
 * the team's dashboard account is created here instead.
 *
 * Usage:
 *   node seed/createAdmin.js "Jane Doe" jane@canadadigitoba.com "StrongPassword123!"
 *   npm run seed:admin -- "Jane Doe" jane@canadadigitoba.com "StrongPassword123!"
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const [, , name, email, password] = process.argv;

const run = async () => {
  if (!name || !email || !password) {
    console.error('Usage: node seed/createAdmin.js "<name>" <email> <password>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = 'admin';
    if (password) existing.password = password; // triggers pre-save hash
    await existing.save();
    console.log(`Existing user ${email} promoted to admin and password updated.`);
  } else {
    await User.create({ name, email, password, role: 'admin' });
    console.log(`Admin user created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Failed to create admin:', err.message);
  process.exit(1);
});
