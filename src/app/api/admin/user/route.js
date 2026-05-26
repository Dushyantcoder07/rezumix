import { connectDB } from "@/db/connectDB"
import userModel from "@/models/userModel";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB()
        const user = await userModel.find({})

        if (!user) {
            return NextResponse.json({ error: "No user found" }, { status: 400 })
        }

        return NextResponse.json({ message: "users fetched successfully", user }, { status: 200 })
    } catch (error) {
        console.log("error: ", error)
        return NextResponse.json({ message: "error while fetching users" }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url)
        const email = searchParams.get("email")

        if (!email) {
            return NextResponse.json({ error: "Missing email id" }, { status: 400 })
        }

        await connectDB()
        const deletedUser = await userModel.findOneAndDelete({ email })

        if (!deletedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Error while deleting user" }, { status: 500 });
    }
}