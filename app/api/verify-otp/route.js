import dbConnect from '../../../lib/dbConnect';
import Otp from '../../../models/Otp';
import { NextResponse } from 'next/server';

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

    return NextResponse.json({ 
        success: true, 
        message: 'OTP verified successfully.'
    }, { status: 200 });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ success: false, message: 'Server error while verifying OTP.' }, { status: 500 });
  }
}
