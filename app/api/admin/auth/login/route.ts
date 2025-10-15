import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Call the backend admin login API
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const response = await fetch(`${backendUrl}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || "Login failed" },
        { status: response.status }
      );
    }

    // Create response with token
    const nextResponse = NextResponse.json({
      message: "Login successful",
      admin: data.admin,
      token: data.token,
    });

    // Set HTTP-only cookie for refresh token if needed
    // For now, we'll use the token in localStorage on the client side
    // In production, consider using HTTP-only cookies for better security

    return nextResponse;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
