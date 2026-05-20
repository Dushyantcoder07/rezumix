import { connectDB } from "@/db/connectDB";
import OTPModel from "@/models/OTPModel";
import userModel from "@/models/userModel";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();

        const { email, otp, newPassword } = body;

        if (!email || !otp || !newPassword) {
            return NextResponse.json({
                success: false,
                message: "All fields are required"
            }, { status: 400 });
        }

        await connectDB();

        const otpRecord = await OTPModel.findOne({
            email: email.toLowerCase().trim()
        });

        if (!otpRecord) {
            return NextResponse.json({
                success: false,
                message: "OTP not found"
            }, { status: 400 });
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json({
                success: false,
                message: "Invalid OTP"
            }, { status: 400 });
        }

        if (new Date(otpRecord.expiresAt) < new Date()) {
            return NextResponse.json({
                success: false,
                message: "OTP expired"
            }, { status: 400 });
        }

        const user = await userModel.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: "User not found"
            }, { status: 404 });
        }

        user.password = newPassword;

        await user.save();

        await OTPModel.deleteOne({
            email: email.toLowerCase().trim()
        });

        return NextResponse.json({
            success: true,
            message: "Password reset successful"
        });

    } catch (error) {
        console.log("RESET PASSWORD ERROR:", error);

        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}