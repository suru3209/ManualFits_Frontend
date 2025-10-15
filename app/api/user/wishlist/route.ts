import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization");
    const response = await fetch(`${backendUrl}/api/user/wishlist`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in GET /api/user/wishlist:", error);
    return NextResponse.json(
      {
        message: "Error fetching wishlist",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization");
    const body = await request.json();

    const response = await fetch(`${backendUrl}/api/user/wishlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in POST /api/user/wishlist:", error);
    return NextResponse.json(
      {
        message: "Error adding to wishlist",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization");
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${backendUrl}/api/user/wishlist?productId=${productId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in DELETE /api/user/wishlist:", error);
    return NextResponse.json(
      {
        message: "Error removing from wishlist",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
