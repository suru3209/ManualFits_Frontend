import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    console.log(
      "Fetching user orders from backend:",
      `${baseUrl}/api/user/orders`
    );

    const response = await fetch(`${baseUrl}/api/user/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend orders error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      {
        message: "Error fetching user orders",
        error: error instanceof Error ? error.message : error,
        orders: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization");
    const body = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const response = await fetch(`${baseUrl}/api/user/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend create order error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating user order:", error);
    return NextResponse.json(
      {
        message: "Error creating user order",
        error: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
