import dbConnect from '../../../lib/dbConnect';
import Code from '../../../models/Code';
import Redemption from '../../../models/Redemption';
import { CashfreeService } from '../../../lib/cashfree';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Function to generate a random amount within a range using crypto.randomInt
function getRandomCashback(min, max) {
    // crypto.randomInt(min, max) generates a random integer between min (inclusive) and max (exclusive).
    // To make max inclusive, we use max + 1.
    return crypto.randomInt(min, max + 1);
}

export async function POST(request) {
  await dbConnect();

  try {
    // --- SECURITY: Verify OTP session cookie ---
    // This ensures the user completed OTP verification before reaching payout.
    const otpSessionToken = request.cookies.get('otp_session')?.value;
    if (!otpSessionToken) {
      return NextResponse.json({ success: false, message: 'Unauthorized: OTP verification required before redemption.' }, { status: 401 });
    }

    let otpSession;
    try {
      otpSession = jwt.verify(otpSessionToken, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, message: 'Unauthorized: OTP session has expired or is invalid. Please verify OTP again.' }, { status: 401 });
    }

    if (!otpSession.verified) {
      return NextResponse.json({ success: false, message: 'Unauthorized: Invalid OTP session.' }, { status: 401 });
    }
    // -------------------------------------------

    const {
      code,
      buyerName,
      buyerMobile,
      paymentMethod,
      upiId,
      bankDetails
    } = await request.json();

    // Confirm the OTP session mobile matches the submitting user's mobile
    if (otpSession.mobile !== buyerMobile) {
      return NextResponse.json({ success: false, message: 'Unauthorized: OTP was verified for a different mobile number.' }, { status: 401 });
    }

    // 1. Find and validate the code
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

    // Check expiresAt date even if status wasn't explicitly updated
    if (foundCode.expiresAt && foundCode.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'This code has expired.' }, { status: 400 });
    }

    // 2. Determine cashback amount
    let cashbackAmount;
    if (foundCode.cashbackAmount && foundCode.cashbackAmount > 0) {
      // Use pre-configured fixed amount
      cashbackAmount = foundCode.cashbackAmount;
    } else if (foundCode.minCashback !== undefined && foundCode.maxCashback !== undefined) {
      // Use custom range
      cashbackAmount = getRandomCashback(foundCode.minCashback, foundCode.maxCashback);
    } else {
      // Fallback to default range (₹5 - ₹500)
      cashbackAmount = getRandomCashback(5, 500);
    }

    // 3. Generate a unique transfer ID for Cashfree
    const transferId = `TR-${foundCode._id}-${Date.now()}`;
    
    // 4. Create the Redemption record FIRST with 'pending' status.
    const redemption = await Redemption.create({
      codeId: foundCode._id,
      buyerName,
      buyerMobile,
      cashbackAmount,
      upiId: paymentMethod === 'upi' ? upiId : undefined,
      bankDetails: paymentMethod === 'bank' ? bankDetails : undefined,
      payoutStatus: 'pending',
      payoutTransactionId: transferId,
      redeemedAt: new Date(),
    });

    // 5. CRITICAL STEP: Mark "code" as redeemed using optimistic locking.
    const updatedCode = await Code.findOneAndUpdate(
      { _id: foundCode._id, status: foundCode.status },
      {
        $set: {
          status: 'redeemed',
          redeemedAt: new Date(),
          cashbackAmount: cashbackAmount,
          redeemedBy: redemption._id
        }
      },
      { new: true }
    );

    if (!updatedCode) {
      // Race condition caught: Code status changed while we were processing.
      await Redemption.findByIdAndDelete(redemption._id);
      return NextResponse.json({ success: false, message: 'This code is currently being processed or was just redeemed.' }, { status: 409 });
    }

    // 6. INITIATE REAL PAYOUT via Cashfree
    let cashfreeResponse;
    try {
      cashfreeResponse = await CashfreeService.initiateTransfer({
        transferId,
        amount: cashbackAmount,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        bankAccount: paymentMethod === 'bank' ? bankDetails?.accountNumber : undefined,
        ifsc: paymentMethod === 'bank' ? bankDetails?.ifsc : undefined,
        name: buyerName,
        phone: buyerMobile
      });

      // Update redemption with successful initiation
      redemption.payoutStatus = 'initiated';
      redemption.payoutReferenceId = cashfreeResponse.reference_id;
      await redemption.save();

    } catch (cfError) {
      console.error('Cashfree Payout Initiation Failed:', cfError);
      
      // If payout fails, we keep the code as 'redeemed' but mark redemption status as 'failed'
      // This prevents double spending and allows admin to retry from dashboard.
      redemption.payoutStatus = 'failed';
      redemption.errorDetails = cfError.message;
      await redemption.save();

      return NextResponse.json({ 
        success: false, 
        message: 'Cashback code redeemed, but payout initiation failed. Please contact support.',
        error: cfError.message,
        data: {
            cashbackAmount,
            redemptionId: redemption._id
        }
      }, { status: 500 });
    }

    // 7. Build success response and clear the OTP session cookie
    const response = NextResponse.json({
        success: true,
        message: 'Cashback redemption successful and payout initiated.',
        data: {
            cashbackAmount,
            payoutTransactionId: transferId,
            redemptionId: redemption._id,
            payoutReferenceId: cashfreeResponse.reference_id
        }
    }, { status: 200 });

    // Delete otp_session to prevent replay attacks
    response.cookies.delete('otp_session');

    return response;

  } catch (error) {
    console.error('Redeem Payout Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during cashback redemption.' }, { status: 500 });
  }
}
