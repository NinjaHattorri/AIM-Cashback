const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '5m', // The document will be automatically deleted after 5 minutes
    },
});

module.exports = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
