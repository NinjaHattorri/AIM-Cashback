import dbConnect from '../../../../lib/dbConnect';
import Redemption from '../../../../models/Redemption';
import Code from '../../../../models/Code';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    // Log all headers for debugging
    const allHeaders = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    console.log('Incoming Webhook Headers:', JSON.stringify(allHeaders));

    // 1. Get raw body for signature verification
    const rawBody = await request.text();
    
    // Check for both v2 and v1 header names
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-cf-signature');
    const timestamp = request.headers.get('x-webhook-timestamp') || request.headers.get('x-cf-timestamp');
    const secretKey = process.env.CASHFREE_CLIENT_SECRET;

    if (!signature || !timestamp || !secretKey) {
      console.error('Webhook Error: Missing required components', {
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        hasSecretKey: !!secretKey,
        headersReceived: Object.keys(allHeaders)
      });
      return NextResponse.json({ 
        message: 'Missing webhook headers or secret key',
        debug: { 
          signature: !!signature, 
          timestamp: !!timestamp, 
          secretKey: !!secretKey,
          availableHeaders: Object.keys(allHeaders)
        }
      }, { status: 400 });
    }

    // 2. Verify Cashfree Signature (HMAC-SHA256)
    const signStr = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(signStr)
      .digest('base64');

    if (expectedSignature !== signature) {
      console.error('Invalid Cashfree Webhook Signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    // 3. Process the Webhook Event
    const event = JSON.parse(rawBody);
    console.log('Cashfree Webhook Received:', event.event_type, event.data?.transfer_id);

    await dbConnect();

    /**
     * Common event types for Payouts V2:
     * - TRANSFER_SUCCESS
     * - TRANSFER_FAILED
     * - TRANSFER_REVERSED
     */
    const { transfer_id, reference_id, status, utr, reason } = event.data;

    // Find the redemption record by transfer_id (which we stored in payoutTransactionId)
    const redemption = await Redemption.findOne({ payoutTransactionId: transfer_id });

    if (!redemption) {
      console.error(`Redemption not found for transfer_id: ${transfer_id}`);
      return NextResponse.json({ message: 'Redemption not found' }, { status: 404 });
    }

    // 4. Update Redemption Status
    let newStatus = 'initiated';
    if (event.event_type === 'TRANSFER_SUCCESS') {
      newStatus = 'completed';
    } else if (event.event_type === 'TRANSFER_FAILED' || event.event_type === 'TRANSFER_REVERSED') {
      newStatus = 'failed';
    }

    redemption.payoutStatus = newStatus;
    redemption.payoutReferenceId = reference_id;
    if (utr) redemption.utr = utr; // We might want to add utr to the model
    if (reason) redemption.errorDetails = reason;
    
    await redemption.save();

    // 5. Sync with Code model if needed (though Code is already 'redeemed')
    // If payout fails, we might want to allow retry, but keeping it 'redeemed' 
    // prevents the user from trying a new payout themselves without admin intervention.

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Cashfree Webhook Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
