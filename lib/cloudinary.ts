/**
 * Cloudinary upload utilities for frontend
 */

export interface CloudinaryUploadResponse {
  success: boolean;
  message?: string;
  url?: string;
  public_id?: string;
  error?: string;
  data?: {
    url?: string;
    public_id?: string;
    successful?: Array<{
      url: string;
      public_id: string;
    }>;
    failed?: Array<{
      error: string;
    }>;
  };
}

/**
 * Upload a single image file to the backend API
 */
export const uploadSingleImage = async (
  file: File,
  token?: string
): Promise<CloudinaryUploadResponse> => {
  try {
    console.log("uploadSingleImage: Starting upload with file:", {
      name: file.name,
      size: file.size,
      type: file.type,
      hasToken: !!token,
    });

    const formData = new FormData();
    formData.append("image", file);

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/upload/single", {
      method: "POST",
      headers,
      body: formData,
    });

    console.log("uploadSingleImage: Response received:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error(
        "uploadSingleImage: Failed to parse JSON response:",
        jsonError
      );
      throw new Error("Invalid response from server");
    }

    if (!response.ok) {
      console.error("Upload API error:", result);
      throw new Error(result?.error || result?.message || "Upload failed");
    }

    return result;
  } catch (error) {
    console.error("uploadSingleImage: Catch block - Upload error:", error);
    console.error("uploadSingleImage: Error type:", typeof error);
    console.error("uploadSingleImage: Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";

    const errorResponse = {
      success: false,
      error: errorMessage,
    };

    console.error("uploadSingleImage: Returning error object:", errorResponse);
    return errorResponse;
  }
};

/**
 * Upload multiple image files to the backend API
 */
export const uploadMultipleImages = async (
  files: File[],
  token?: string
): Promise<CloudinaryUploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch("/api/upload/multiple", {
      method: "POST",
      headers,
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Upload failed");
    }

    return result;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};

/**
 * Delete an image from Cloudinary using public_id
 */
export const deleteImage = async (
  publicId: string,
  token?: string
): Promise<boolean> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/upload/${publicId}`, {
      method: "DELETE",
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Delete failed");
    }

    return result.success;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
};
