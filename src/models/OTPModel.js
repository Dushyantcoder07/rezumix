import mongoose from "mongoose"

const OTPSchema = mongoose.Schema({
    email: {
        type: String
    },
    otp: {
        type: String
    },
    expiresAt: {
        type: Date
    },
}, {
    timestamps: true
})

// TTL index: MongoDB automatically deletes documents when expiresAt is in the past
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.OTP || mongoose.model("OTP", OTPSchema);