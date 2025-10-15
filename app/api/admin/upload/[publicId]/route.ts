import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    if (!publicId) {
      return NextResponse.json(
        { message: "Public ID is required" },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      return NextResponse.json({
        message: "Image deleted successfully",
        publicId,
      });
    } else {
      return NextResponse.json(
        { message: "Failed to delete image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
