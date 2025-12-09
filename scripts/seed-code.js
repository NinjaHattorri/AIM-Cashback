// scripts/seed-code.js
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const Code = require('../models/Code'); // Adjust path as necessary

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const seedCode = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected...');

    const codeToSeed = {
      code: 'ABCD',
      cashbackAmount: 10, // Example cashback amount
      status: 'generated',
    };

    // Check if the code already exists
    const existingCode = await Code.findOne({ code: codeToSeed.code });
    if (existingCode) {
      console.log(`Code "${codeToSeed.code}" already exists. Seeding not required.`);
    } else {
      await Code.create(codeToSeed);
      console.log(`Successfully seeded code: "${codeToSeed.code}"`);
    }

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedCode();
