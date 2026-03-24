import mongoose from 'mongoose';

const CodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please provide a unique code'],
        unique: true,
        trim: true,
        maxlength: [20, 'Code cannot be more than 20 characters']
    },
    cashbackAmount: {
        type: Number,
        required: false // Amount will be set upon redemption or pre-set during generation
    },
    minCashback: {
        type: Number,
        required: false
    },
    maxCashback: {
        type: Number,
        required: false
    },
    status: {
        type: String,
        enum: ['generated', 'pending_redemption', 'redeemed', 'expired'],
        default: 'generated'
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: false // Optional expiration
    },
    redeemedBy: {
        type: mongoose.Schema.Types.ObjectId, // Fixed: was Schema.ObjectId
        ref: 'Redemption',
        required: false
    },
    redeemedAt: {
        type: Date,
        required: false
    }
});

export default mongoose.models.Code || mongoose.model('Code', CodeSchema);
