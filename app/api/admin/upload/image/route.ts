import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "Invalid file type. Only images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File size too large. Maximum size is 10MB" },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "manualfits/products",
            resource_type: "auto",
            quality: "auto",
            fetch_format: "auto",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json({
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
      width: (result as any).width,
      height: (result as any).height,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);

    // Provide more specific error messages
    let errorMessage = "Upload failed";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("Invalid cloud name")) {
        errorMessage = "Cloudinary configuration error: Invalid cloud name";
        statusCode = 500;
      } else if (error.message.includes("Invalid API key")) {
        errorMessage = "Cloudinary configuration error: Invalid API key";
        statusCode = 500;
      } else if (error.message.includes("Invalid API secret")) {
        errorMessage = "Cloudinary configuration error: Invalid API secret";
        statusCode = 500;
      } else if (error.message.includes("File too large")) {
        errorMessage = "File size too large. Maximum size is 10MB";
        statusCode = 413;
      } else if (error.message.includes("Invalid file type")) {
        errorMessage = "Invalid file type. Only images are allowed";
        statusCode = 400;
      } else {
        errorMessage = `Upload failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      {
        message: errorMessage,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: statusCode }
    );
  }
}
