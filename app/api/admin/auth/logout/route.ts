import { NextResponse } from "next/server";

export async function POST() {
  try {
    // In a real implementation, you might want to blacklist the token
    // or invalidate it on the server side

    const response = NextResponse.json({
      message: "Logout successful",
    });

    // Clear any HTTP-only cookies if they exist
    response.cookies.delete("adminToken");
    response.cookies.delete("refreshToken");

    return response;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
