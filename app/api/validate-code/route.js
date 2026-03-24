import dbConnect from '../../../lib/dbConnect';
import Code from '../../../models/Code';
import { NextResponse } from 'next/server';
import rateLimit from '../../../lib/rateLimit';

const limiter = rateLimit({
  limit: 5,
  windowMs: 60 * 1000,
});

export async function POST(request) {
  const response = new NextResponse();
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';

  try {
    await limiter.check(response, ip);
  } catch {
    return NextResponse.json({ success: false, message: 'Too many validation attempts. Please try again in a minute.' }, { status: 429 });
  }

  await dbConnect();

  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: 'Code is required.' }, { status: 400 });
    }

    const foundCode = await Code.findOne({ code: code.trim() });

    if (!foundCode) {
      return NextResponse.json({ success: false, message: 'Invalid code.' }, { status: 404 });
    }

    if (foundCode.status === 'redeemed') {
      return NextResponse.json({ success: false, message: 'This code has already been redeemed.' }, { status: 400 });
    }

    if (foundCode.status === 'expired') {
      return NextResponse.json({ success: false, message: 'This code has expired.' }, { status: 400 });
    }

    // Check expiresAt date even if status hasn't been explicitly updated
    if (foundCode.expiresAt && foundCode.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'This code has expired.' }, { status: 400 });
    }

    // IMPORTANT: Per GEMINI.md, code status is NOT changed here.
    // It is only marked 'redeemed' immediately before the payout in /api/redeem-payout.

    return NextResponse.json({
        success: true,
        message: 'Code is valid.'
    }, { status: 200 });

  } catch (error) {
    console.error('Validation Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during code validation.' }, { status: 500 });
  }
}
