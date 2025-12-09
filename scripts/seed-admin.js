// scripts/seed-admin.js
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const AdminUser = require('../models/AdminUser'); // Adjust path as necessary

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const seedAdminUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected...');

    const defaultUsername = 'admin';
    const defaultPassword = 'password'; // This password will be hashed by the pre-save hook

    // Check if the admin user already exists
    const existingAdmin = await AdminUser.findOne({ username: defaultUsername });

    if (existingAdmin) {
      console.log(`Admin user "${defaultUsername}" already exists. Seeding not required.`);
    } else {
      await AdminUser.create({
        username: defaultUsername,
        password: defaultPassword,
      });
      console.log(`Successfully seeded admin user: "${defaultUsername}" with password "${defaultPassword}"`);
      console.log('Remember to change the default password in a production environment!');
    }

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedAdminUser();
