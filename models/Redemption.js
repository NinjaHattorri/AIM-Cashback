import mongoose from 'mongoose';

const RedemptionSchema = new mongoose.Schema({
    codeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Code',
        required: [true, 'Redemption must be linked to a Code']
    },
    buyerName: {
        type: String,
        required: [true, 'Please provide buyer name'],
        trim: true
    },
    buyerMobile: {
        type: String,
        required: [true, 'Please provide buyer mobile number'],
        trim: true,
        match: [/^\d{10}$/, 'Please fill a valid 10 digit mobile number']
    },
    cashbackAmount: {
        type: Number,
        required: [true, 'Cashback amount must be recorded for redemption']
    },
    upiId: {
        type: String,
        required: false,
        trim: true
    },
    bankDetails: {
        accountNumber: {
            type: String,
            required: false,
            trim: true
        },
        ifscCode: {
            type: String,
            required: false,
            trim: true
        },
        accountHolderName: {
            type: String,
            required: false,
            trim: true
        }
    },
    payoutStatus: {
        type: String,
        enum: ['initiated', 'completed', 'failed', 'pending'],
        default: 'pending'
    },
    payoutTransactionId: {
        type: String,
        required: false,
        trim: true
    },
    redeemedAt: {
        type: Date,
        default: Date.now
    }
});

// Custom validation: either upiId OR all three bank fields must be present
RedemptionSchema.pre('validate', function(next) {
    const hasUpi = !!this.upiId;
    const bd = this.bankDetails;
    const hasBankDetails = bd && bd.accountNumber && bd.ifscCode && bd.accountHolderName;

    if (!hasUpi && !hasBankDetails) {
        this.invalidate('upiId', 'Either a UPI ID or complete bank details (account number, IFSC, and account holder name) must be provided.');
    }
    next();
});

export default mongoose.models.Redemption || mongoose.model('Redemption', RedemptionSchema);
