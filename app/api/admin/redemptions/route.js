import dbConnect from '../../../../lib/dbConnect';
import Redemption from '../../../../models/Redemption';
import Code from '../../../../models/Code'; // Required for population
import { CashfreeService } from '../../../../lib/cashfree';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Helper: check if an error is an auth failure
function isAuthError(error) {
    return (
      error.message?.includes('Auth token') ||
      error.message?.includes('not an admin') ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    );
}

export async function GET(request) {
// ... existing GET implementation ...
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) throw new Error('Auth token not found');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) throw new Error('User is not an admin');

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const status = searchParams.get('status');
    
    let filter = {};
    if (query) {
      filter.$or = [
          { buyerName: { $regex: query, $options: 'i' } },
          { buyerMobile: { $regex: query, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') {
      filter.payoutStatus = status;
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
    if (isAuthError(error)) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }
    console.error('Redemptions Fetch Error:', error);
    return NextResponse.json({ success: false, message: 'Server error fetching redemptions.' }, { status: 500 });
  }
}

// PATCH: Sync a specific redemption status with Cashfree manually
export async function PATCH(request) {
    try {
        const token = request.cookies.get('auth_token')?.value;
        if (!token) throw new Error('Auth token not found');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.isAdmin) throw new Error('User is not an admin');

        await dbConnect();
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ success: false, message: 'Redemption ID is required.' }, { status: 400 });
        }

        const redemption = await Redemption.findById(id);
        if (!redemption) {
            return NextResponse.json({ success: false, message: 'Redemption record not found.' }, { status: 404 });
        }

        if (!redemption.payoutTransactionId) {
            return NextResponse.json({ success: false, message: 'No Cashfree transaction ID found for this record.' }, { status: 400 });
        }

        // Fetch real-time status from Cashfree
        const cfStatus = await CashfreeService.getTransferStatus(redemption.payoutTransactionId);
        
        console.log('Cashfree Sync Response:', JSON.stringify(cfStatus));

        /**
         * Cashfree Payout Statuses (v2):
         * status can be: SUCCESS, FAILED, PENDING, PROCESSING, REVERSED
         */
        const currentStatus = cfStatus.status || cfStatus.transfer_status;
        
        let newStatus = redemption.payoutStatus;
        if (currentStatus === 'SUCCESS') {
            newStatus = 'completed';
        } else if (['FAILED', 'REVERSED', 'ERROR'].includes(currentStatus)) {
            newStatus = 'failed';
        }

        redemption.payoutStatus = newStatus;
        redemption.payoutReferenceId = cfStatus.reference_id || redemption.payoutReferenceId;
        if (cfStatus.utr) redemption.utr = cfStatus.utr;
        if (cfStatus.failure_reason) redemption.errorDetails = cfStatus.failure_reason;

        await redemption.save();

        return NextResponse.json({ 
            success: true, 
            message: `Sync successful! Payout marked as '${newStatus}' (Raw Cashfree status: ${currentStatus})`,
            data: { 
                status: newStatus,
                cfRawStatus: currentStatus
            } 
        }, { status: 200 });

    } catch (error) {
        if (isAuthError(error)) {
            return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
        }
        console.error('Sync Status Error:', error);
        return NextResponse.json({ success: false, message: 'Sync failed: ' + error.message }, { status: 500 });
    }
}
