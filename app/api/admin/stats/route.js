import dbConnect from '../../../../lib/dbConnect';
import Code from '../../../../models/Code';
import Redemption from '../../../../models/Redemption';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Manual Authentication Check
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    // Original Route Logic
    await dbConnect();
    const totalCodesGenerated = await Code.countDocuments();
    const totalCodesRedeemed = await Code.countDocuments({ status: 'redeemed' });

    const totalCashbackResult = await Redemption.aggregate([
      { $match: { payoutStatus: { $in: ['initiated', 'completed'] } } },
      { $group: { _id: null, totalAmount: { $sum: '$cashbackAmount' } } }
    ]);

    const totalCashbackPaid = totalCashbackResult.length > 0 ? totalCashbackResult[0].totalAmount : 0;

    const stats = {
      totalCodesGenerated,
      totalCodesRedeemed,
      totalCashbackPaid,
    };

    return NextResponse.json({ success: true, data: stats }, { status: 200 });

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ success: false, message: `Authentication failed: ${error.message}` }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
