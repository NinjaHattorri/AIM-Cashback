import dbConnect from '../../../lib/dbConnect';
import Code from '../../../models/Code';
import Redemption from '../../../models/Redemption';
import { NextResponse } from 'next/server';
import crypto from 'crypto'; // Import the crypto module

// Function to generate a random amount within a range using crypto.randomInt
function getRandomCashback(min, max) {
    // crypto.randomInt(min, max) generates a random integer between min (inclusive) and max (exclusive).
    // To make max inclusive, we use max + 1.
    return crypto.randomInt(min, max + 1);
}

export async function POST(request) {
  await dbConnect();

  try {
    const { 
      code, 
      buyerName, 
      buyerMobile, 
      paymentMethod, 
      upiId, 
      bankDetails 
    } = await request.json();

    // 1. Find the code
    const foundCode = await Code.findOne({ code });

    if (!foundCode) {
      return NextResponse.json({ success: false, message: 'Invalid code provided for redemption.' }, { status: 400 });
    }

    if (foundCode.status === 'redeemed') {
      return NextResponse.json({ success: false, message: 'This code has already been redeemed.' }, { status: 400 });
    }

    if (foundCode.status === 'expired') {
      return NextResponse.json({ success: false, message: 'This code has expired.' }, { status: 400 });
    }

    // 2. Generate random cashback amount using crypto.randomInt
    const cashbackAmount = getRandomCashback(5, 500);

    // 3. CRITICAL STEP: Mark code as redeemed and store cashback amount
    foundCode.status = 'redeemed';
    foundCode.redeemedAt = new Date();
    foundCode.cashbackAmount = cashbackAmount; // Store the determined amount
    await foundCode.save();

    // 4. Simulate payout and generate a transaction ID
    const payoutTransactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const payoutStatus = 'initiated'; // In a real system, this would come from the payment gateway

    // 5. Create a new Redemption entry
    const redemption = await Redemption.create({
      codeId: foundCode._id,
      buyerName,
      buyerMobile,
      cashbackAmount, // Store the determined amount
      upiId: paymentMethod === 'upi' ? upiId : undefined,
      bankDetails: paymentMethod === 'bank' ? bankDetails : undefined,
      payoutStatus,
      payoutTransactionId,
      redeemedAt: new Date(),
    });

    // Link the redemption to the code
    foundCode.redeemedBy = redemption._id;
    await foundCode.save();


    return NextResponse.json({ 
        success: true, 
        message: 'Cashback redemption successful and payout initiated.',
        data: {
            cashbackAmount,
            payoutTransactionId,
            redemptionId: redemption._id
        }
    }, { status: 200 });

  } catch (error) {
    console.error('Redeem Payout Error:', error);
    // If something goes wrong after marking the code as redeemed,
    // you might want to implement a rollback or a manual review process.
    return NextResponse.json({ success: false, message: 'Server error during cashback redemption.' }, { status: 500 });
  }
}
