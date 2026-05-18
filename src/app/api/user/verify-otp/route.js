import { connectDB } from "@/db/connectDB"
import OTPModel from "@/models/OTPModel";
import userModel from "@/models/userModel";
import { NextResponse } from "next/server";
import { isPlainString, isValidEmail, validateOTP } from "@/lib/validation";

export async function POST(req) {
    try {
        const body = await req.json();

        // ── 1. Type-check: reject non-string / object inputs (NoSQL injection prevention) ──
        if (!isPlainString(body.email) || !isPlainString(body.otp)) {
            return NextResponse.json({
                message: "Invalid input types",
                errors: [{ field: "general", messages: ["All fields must be plain text strings"] }]
            }, { status: 400 });
        }

        const { email, otp } = body;

        // ── 2. Validate inputs ──
        const fieldErrors = [];
        
        if (!email.trim() || !isValidEmail(email)) {
            fieldErrors.push({ field: "email", messages: ["Enter a valid email address"] });
        }
        
        const otpValidation = validateOTP(otp);
        if (!otpValidation.valid) {
            fieldErrors.push({ field: "otp", messages: otpValidation.errors });
        }

        if (fieldErrors.length > 0) {
            return NextResponse.json({
                message: "Validation failed",
                errors: fieldErrors
            }, { status: 400 });
        }

        const sanitizedEmail = email.trim().toLowerCase();

        await connectDB();

        // ── 3. Check if user exists and is already verified ──
        const user = await userModel.findOne({ email: sanitizedEmail });
        if (!user) {
            return NextResponse.json({ 
                message: "User not found",
                errors: [{ field: "email", messages: ["No user associated with this email could be found"] }]
            }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.json({ 
                success: false,
                message: "Already verified",
                isAlreadyVerified: true,
                errors: [{ field: "email", messages: ["This account is already verified. Please log in."] }]
            }, { status: 400 });
        }

        // ── 4. Find OTP record ──
        const record = await OTPModel.findOne({ email: sanitizedEmail });

        if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
            return NextResponse.json({ 
                message: "Invalid or expired OTP",
                errors: [{ field: "otp", messages: ["The OTP provided is invalid or has expired"] }]
            }, { status: 400 });
        }

        // ── 4. Update user verification status safely (no upsert) ──
        const userUpdateResult = await userModel.updateOne(
            { email: sanitizedEmail }, 
            { isVerified: true }
        );

        // check if user actually existed and was updated
        if (userUpdateResult.matchedCount === 0) {
            return NextResponse.json({ 
                message: "User not found",
                errors: [{ field: "email", messages: ["No user associated with this email could be found"] }]
            }, { status: 404 });
        }

        // ── 5. Cleanup OTP ──
        await OTPModel.deleteOne({ email: sanitizedEmail });

        return NextResponse.json({ success: true, message: "Email verified successfully" }, { status: 200 });
    } catch (error) {
        console.log("verify-otp error: ", error)
        return NextResponse.json({ 
            message: "Internal server error",
            errors: [{ field: "general", messages: ["Something went wrong. Please try again later."] }]
        }, { status: 500 })
    }
}
