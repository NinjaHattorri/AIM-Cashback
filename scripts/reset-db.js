// scripts/reset-db.js
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const Code = require('../models/Code');
const Redemption = require('../models/Redemption');
const Otp = require('../models/Otp');
const AdminUser = require('../models/AdminUser');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const resetDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for full reset...');

    // Delete all records
    const codeDel = await Code.deleteMany({});
    const redDel = await Redemption.deleteMany({});
    const otpDel = await Otp.deleteMany({});
    const userDel = await AdminUser.deleteMany({});

    console.log(`Deleted: ${codeDel.deletedCount} Codes, ${redDel.deletedCount} Redemptions, ${otpDel.deletedCount} OTPs, ${userDel.deletedCount} Admin Users.`);

    // Re-seed default admin
    await AdminUser.create({
      username: 'admin',
      password: 'password'
    });
    console.log('Default admin user created (admin / password).');
    console.log('Database reset complete. System is fresh.');

  } catch (error) {
    console.error('Error during database reset:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

resetDatabase();
