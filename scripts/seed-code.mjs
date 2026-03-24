// scripts/seed-code.mjs
import 'dotenv/config';
import mongoose from 'mongoose';
import Code from '../models/Code.js';

import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const seedCode = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected...');

    const codeToSeed = {
      code: 'ABCD',
      cashbackAmount: 10,
      status: 'generated',
    };

    const existingCode = await Code.findOne({ code: codeToSeed.code });
    if (existingCode) {
      console.log(`Code "${codeToSeed.code}" already exists.`);
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
