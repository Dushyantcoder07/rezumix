import { connectDB } from "@/db/connectDB";
import { sendOTPEmail } from "@/lib/mail";
import { isPlainString, isValidEmail } from "@/lib/validation";
import OTPModel from "@/models/OTPModel";
import userModel from "@/models/userModel";
import { NextResponse } from "next/server";

// Cooldown period in seconds
const OTP_COOLDOWN_SECONDS = 60;

export async function POST(req) {
    try {
        const body = await req.json();

        // ── 1. Type-check ──
        if (!body || !isPlainString(body.email)) {
            return NextResponse.json({
                success: false,
                message: "Invalid input",
                errors: [{ field: "email", messages: ["Email must be a valid string"] }]
            }, { status: 400 });
        }

        const sanitizedEmail = body.email.trim().toLowerCase();

        // ── 2. Email format validation ──
        if (!isValidEmail(sanitizedEmail)) {
            return NextResponse.json({
                success: false,
                message: "Invalid email format",
                errors: [{ field: "email", messages: ["Please enter a valid email address"] }]
            }, { status: 400 });
        }

        await connectDB();

        // ── 3. Check if user exists and is not already verified ──
        const user = await userModel.findOne({ email: sanitizedEmail });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found",
                errors: [{ field: "email", messages: ["No account found with this email. Please register first."] }]
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

        // ── 4. Cooldown check: prevent OTP spamming ──
        const existingOTP = await OTPModel.findOne({ email: sanitizedEmail });

        if (existingOTP) {
            const referenceTime = existingOTP.lastSentAt ? new Date(existingOTP.lastSentAt).getTime() : new Date(existingOTP.createdAt).getTime();
            const secondsSinceLastSent = (Date.now() - referenceTime) / 1000;
            const remainingCooldown = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLastSent);

            if (remainingCooldown > 0) {
                return NextResponse.json({
                    success: false,
                    message: `Please wait ${remainingCooldown} seconds before requesting a new OTP`,
                    cooldownRemaining: remainingCooldown,
                    errors: [{ field: "otp", messages: [`Please wait ${remainingCooldown}s before requesting a new OTP`] }]
                }, { status: 429 });
            }

            // Cooldown passed — delete old OTP before generating a new one
            await OTPModel.deleteOne({ email: sanitizedEmail });
        }

        // ── 5. Generate and save new OTP ──
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTPModel.create({
            email: sanitizedEmail,
            otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            lastSentAt: new Date()
        });

        // ── 6. Send OTP email ──
        await sendOTPEmail(sanitizedEmail, otp);

        // Update lastSentAt to the exact post-SMTP timestamp to eliminate the 3-5s email transport lag
        await OTPModel.updateOne({ email: sanitizedEmail }, { $set: { lastSentAt: new Date() } });

        return NextResponse.json({
            success: true,
            message: "A new OTP has been sent to your email",
            cooldownSeconds: OTP_COOLDOWN_SECONDS
        }, { status: 200 });

    } catch (error) {
        console.log("Resend OTP error: ", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            errors: [{ field: "general", messages: ["Something went wrong. Please try again later."] }]
        }, { status: 500 });
    }
}
