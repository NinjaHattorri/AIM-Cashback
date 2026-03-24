import dbConnect from '../../../lib/dbConnect';
import Code from '../../../models/Code';
import { NextResponse } from 'next/server';

/**
 * CRON Job to update status of expired codes.
 * This should be triggered periodically (e.g., daily) by a GitHub Action,
 * Vercel Cron, or an external cron service.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  
  // Security Check: Ensure only authorized triggers can run this
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    const now = new Date();
    
    // Find codes that are past their expiry date and not yet marked 'redeemed' or 'expired'
    const result = await Code.updateMany(
      {
        status: { $nin: ['redeemed', 'expired'] },
        expiresAt: { $lt: now }
      },
      {
        $set: { status: 'expired' }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Expiry status updated.',
      modifiedCount: result.modifiedCount
    }, { status: 200 });

  } catch (error) {
    console.error('Expiry Job Error:', error);
    return NextResponse.json({ success: false, message: 'Server error during expiry job.' }, { status: 500 });
  }
}
