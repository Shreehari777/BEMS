/**
 * seed-admin.js
 * 
 * Run this ONCE to create the initial admin account.
 * Usage: node seed-admin.js
 * 
 * Admin credentials are read from environment variables:
 *   ADMIN_USERNAME  (default: "admin")
 *   ADMIN_PASSWORD  (default: "admin123")
 * 
 * Set these in your .env file or pass them inline:
 *   ADMIN_USERNAME=myadmin ADMIN_PASSWORD=secret123 node seed-admin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config ? require('dotenv').config() : null;

// ── Config ──
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not set in .env');
  process.exit(1);
}

// ── User Schema (matches lib/models/User.ts) ──
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  displayName: { type: String, default: '' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete old BEMS user if it exists (legacy auth system)
    const bemsUser = await User.findOne({ username: 'BEMS' });
    if (bemsUser) {
      await User.deleteOne({ username: 'BEMS' });
      console.log('🗑️  Removed old BEMS user');
    }

    // Check if the new admin already exists
    const existing = await User.findOne({ username: ADMIN_USERNAME, role: 'admin' });
    if (existing) {
      console.log(`⚠️  Admin "${ADMIN_USERNAME}" already exists.`);
      console.log('   To reset, delete the admin user from MongoDB first.');
      await mongoose.disconnect();
      return;
    }

    // Hash password and create admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    await User.create({
      username: ADMIN_USERNAME,
      password: hashedPassword,
      role: 'admin',
      displayName: 'Administrator',
    });

    console.log('');
    console.log('✅ Admin account created successfully!');
    console.log('─────────────────────────────────');
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('─────────────────────────────────');
    console.log('');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
