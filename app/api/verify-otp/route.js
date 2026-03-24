import dbConnect from '../../../lib/dbConnect';
import Otp from '../../../models/Otp';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  await dbConnect();

  try {
    const { mobile, otp } = await request.json();

    if (!mobile || !otp) {
      return NextResponse.json({ success: false, message: 'Mobile number and OTP are required.' }, { status: 400 });
    }

    // Find the most recent OTP for this number
    const foundOtp = await Otp.findOne({ mobile }).sort({ createdAt: -1 });

    if (!foundOtp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP or OTP has expired.' }, { status: 400 });
    }

    if (foundOtp.otp !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP.' }, { status: 400 });
    }

    // OTP is correct, delete it to prevent reuse
    await Otp.deleteOne({ _id: foundOtp._id });

    // Issue a short-lived OTP session token so redeem-payout can verify
    // that the user completed OTP before reaching the payout step.
    const otpSessionToken = jwt.sign(
      { mobile, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = NextResponse.json({
        success: true,
        message: 'OTP verified successfully.'
    }, { status: 200 });

    // Set as httpOnly cookie so it can't be stolen via JS
    response.cookies.set('otp_session', otpSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
      sameSite: 'strict',
    });

    return response;

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ success: false, message: 'Server error while verifying OTP.' }, { status: 500 });
  }
}
