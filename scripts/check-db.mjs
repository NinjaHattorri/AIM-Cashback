// scripts/check-db.mjs
import 'dotenv/config';
import mongoose from 'mongoose';
import Code from '../models/Code.js';

import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

const checkDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected...');

    const totalCodes = await Code.countDocuments();
    console.log(`Total codes in database: ${totalCodes}`);

    if (totalCodes > 0) {
      console.log('\nLast 5 codes:');
      const lastCodes = await Code.find().sort({ generatedAt: -1 }).limit(5);
      lastCodes.forEach(c => {
        console.log(`- Code: ${c.code}, Status: ${c.status}, Cashback: ${c.cashbackAmount || 'N/A'}, Min/Max: ${c.minCashback || 'N/A'}/${c.maxCashback || 'N/A'}`);
      });

      console.log('\nStatus Breakdown:');
      const stats = await Code.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      stats.forEach(s => console.log(`- ${s._id}: ${s.count}`));
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected.');
  }
};

checkDatabase();
