import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    
    const response = await fetch(
      `${baseUrl}/api/admin/public/payment-settings`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );


    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json(
      {
        message: "Error fetching payment settings",
        error: error instanceof Error ? error.message : error,
        paymentSettings: null,
      },
      { status: 500 }
    );
  }
}
