import dbConnect from '../../../lib/dbConnect';
import Code from '../../../models/Code';
import { NextResponse } from 'next/server';

export async function POST(request) {
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
    
    // As per GEMINI.md, status is not changed here.
    // It's only marked 'redeemed' just before payout.
    // We can, however, move it to 'pending_redemption'
    
    foundCode.status = 'pending_redemption';
    await foundCode.save();


    return NextResponse.json({ 
        success: true, 
        message: 'Code is valid.'
    }, { status: 200 });

  } catch (error) {
    console.error('Validation Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during code validation.' }, { status: 500 });
  }
}
