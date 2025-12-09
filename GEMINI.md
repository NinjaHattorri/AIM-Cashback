# QR Cashback Redemption System Project Context

This file serves as the long-term memory for all Gemini CLI sessions within this project directory.

## Core Flow
1. Buyer scans QR code (contains unique code).
2. Mobile site opens.
3. Buyer enters Name/Mobile number.
4. **OTP Verification** authenticates the mobile number.
5. Buyer enters the **Unique Cashback Code** from the product.
6. **Code Validation Check:** Must be unused, not expired, and exist. (No status change here).
7. Buyer enters UPI ID or bank details.
8. System initiates payout via Cashfree/RazorpayX.
9. **CRITICAL STEP:** Code is marked 'redeemed' ONLY immediately before initiating the payout.

## Technical Stack
* **Frontend:** Next.js (Mobile-first, App Router).
* **Backend/API:** Node.js/Express (Serverless architecture).
* **Database:** MongoDB Atlas (Dedicated user created, Connection via Mongoose and `.env.local`).
* **Payments:** Mediator-based Payouts (UPI/IMPS).
* **Security:** HTTPS, Rate limiting, One-time code use.

## Admin Requirements
* Secure login.
* Bulk code generation (with fixed or range-based cashback amounts).
* Dashboard for tracking: Codes generated, Redemption status (Redeemed vs Pending), Total cashback paid.

## Current Progress
* Node.js is installed.
* MongoDB Atlas dedicated user is created and connected via `MONGODB_URI` in `.env.local`.
* The `lib/dbConnect.js` utility file has been created.
* **Next Task:** Define the Mongoose Schemas for `Codes` and `Redemptions`.