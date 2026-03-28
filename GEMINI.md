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
* **Payments:** Mediator-based Payouts (UPI/IMPS) integrated via Cashfree.

## Current Progress
* Node.js environment is set up.
* MongoDB Atlas is connected via `MONGODB_URI` in `.env.local`.
* **Mongoose Schemas:** `AdminUser`, `Code`, `Otp`, and `Redemption` are fully defined and updated for payment tracking.
* **Redemption Flow:**
    * `/api/validate-code`: Implemented with rate limiting.
    * `/api/send-otp` & `/api/verify-otp`: Implemented with rate limiting and JWT session management.
    * `/api/redeem-payout`: Fully integrated with **Cashfree Payouts (v2 API)** for real-time UPI/Bank transfers.
* **Admin System:**
    * Secure login with JWT and bcrypt password hashing.
    * Dashboard for tracking generated/redeemed codes and total payouts.
    * **Configurable Cashback:** Bulk generation now supports Fixed Amount, Custom Range, or Default Range.
    * **Enhanced Tools:** Inventory and Payouts pages now support Search and Status Filtering.
    * **Security:** Rate limiting implemented on public-facing endpoints.
    * **Automation:** Maintenance API `/api/cron/update-expired-codes` created to update past-due code statuses.

## Next Task
* **Payout Status Webhooks:** Implement a webhook listener to update `Redemption` records automatically when Cashfree confirms payment success/failure.
* **Analytics/Reporting:** Add data export (CSV/Excel) for redemptions and more detailed charts on the dashboard.
* **Mobile UI Polish:** Fine-tune the redemption mobile experience for edge cases.