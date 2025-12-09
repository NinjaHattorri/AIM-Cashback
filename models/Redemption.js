const mongoose = require('mongoose');

const RedemptionSchema = new mongoose.Schema({
    codeId: {
        type: mongoose.Schema.ObjectId,
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
        match: [/^\d{10}$/, 'Please fill a valid 10 digit mobile number'] // Basic 10-digit mobile number validation
    },
    cashbackAmount: {
        type: Number,
        required: [true, 'Cashback amount must be recorded for redemption']
    },
    upiId: {
        type: String,
        required: false, // Either UPI ID or bank details are required
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

// Custom validation to ensure either upiId or bankDetails are provided
RedemptionSchema.pre('validate', function(next) {
    if (!this.upiId && (!this.bankDetails || (!this.bankDetails.accountNumber && !this.bankDetails.ifscCode && !this.bankDetails.accountHolderName))) {
        this.invalidate('upiId', 'Either UPI ID or bank details must be provided for redemption.');
    }
    next();
});

module.exports = mongoose.models.Redemption || mongoose.model('Redemption', RedemptionSchema);
