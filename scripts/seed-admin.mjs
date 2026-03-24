// scripts/seed-admin.mjs
import 'dotenv/config';
import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';

// Setup dotenv from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const seedAdminUser = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    console.log('MongoDB connected...');

    const defaultUsername = 'admin';
    const defaultPassword = 'password';

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
    }

  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedAdminUser();
