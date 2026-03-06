import dbConnect from '../../../../lib/dbConnect';
import Redemption from '../../../../models/Redemption';
import Code from '../../../../models/Code'; // Required for population
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    let filter = {};
    if (query) {
      filter = {
        $or: [
          { buyerName: { $regex: query, $options: 'i' } },
          { buyerMobile: { $regex: query, $options: 'i' } },
        ]
      };
    }

    let redemptions = await Redemption.find(filter).populate('codeId').sort({ redeemedAt: -1 });
    
    // If we searched by code, filter specifically
    if (query) {
        // If query matches code specifically, we might need to filter redemptions that have that codeId
        const codesMatching = await Code.find({ code: { $regex: query, $options: 'i' } });
        const codeIds = codesMatching.map(c => c._id);
        
        if (codeIds.length > 0) {
            const redemptionsByCode = await Redemption.find({ codeId: { $in: codeIds } }).populate('codeId');
            
            // Merge results (avoid duplicates)
            const combinedResults = [...redemptions, ...redemptionsByCode];
            const uniqueResults = Array.from(new Set(combinedResults.map(a => a._id.toString())))
                                .map(id => combinedResults.find(a => a._id.toString() === id));
            
            redemptions = uniqueResults.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
        }
    }

    return NextResponse.json({ success: true, data: redemptions }, { status: 200 });

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ success: false, message: error.message }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
