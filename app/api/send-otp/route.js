import dbConnect from '../../../lib/dbConnect';
import Otp from '../../../models/Otp';
import { NextResponse } from 'next/server';
import rateLimit from '../../../lib/rateLimit';

const limiter = rateLimit({
  limit: 3, // 3 requests
  windowMs: 60 * 1000, // per 60 seconds
});

export async function POST(request) {
  const response = new NextResponse();
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  try {
    await limiter.check(response, ip);
  } catch {
    return NextResponse.json({ success: false, message: 'Too many requests. Please try again in a minute.' }, { status: 429 });
  }

  await dbConnect();

  try {
    const { mobile } = await request.json();

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: 'Valid 10-digit mobile number is required.' }, { status: 400 });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In a real application, you would send this OTP via an SMS gateway.
    // For this project, we will save it to the database with an expiry.

    // Remove any existing OTP for this number to avoid duplicates
    await Otp.deleteOne({ mobile });

    // Save the new OTP
    await Otp.create({ mobile, otp });

    // In a real app, you would NOT send the OTP back in the response.
    // We are doing this for testing purposes only.
    return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully (simulation).',
        // REMOVE IN PRODUCTION:
        otp: otp 
    }, { status: 200 });

  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ success: false, message: 'Server error while sending OTP.' }, { status: 500 });
  }
}
