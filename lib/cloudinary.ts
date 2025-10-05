// Cloudinary utility functions for frontend

export interface CloudinaryUploadResponse {
  success: boolean;
  message: string;
  data?: {
    url: string;
    public_id: string;
  };
  error?: string;
}

export interface CloudinaryMultipleUploadResponse {
  success: boolean;
  message: string;
  data?: {
    successful: Array<{
      url: string;
      public_id: string;
    }>;
    failed: Array<{
      error: string;
    }>;
  };
  error?: string;
}

// Upload single image
export const uploadSingleImage = async (
  file: File,
  token: string
): Promise<CloudinaryUploadResponse> => {
  try {
    console.log("Starting upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    if (!token) {
      console.error("No token provided");
      return {
        success: false,
        message: "No authentication token provided",
        error: "Authentication required",
      };
    }

    const formData = new FormData();
    formData.append("image", file);

    console.log("Sending request to /api/upload/single");
    const response = await fetch("/api/upload/single", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed with status:", response.status, errorText);
      return {
        success: false,
        message: `Upload failed: ${response.status} ${response.statusText}`,
        error: errorText,
      };
    }

    const result = await response.json();
    console.log("Upload result:", result);
    return result;
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      message: "Upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Upload multiple images
export const uploadMultipleImages = async (
  files: File[],
  token: string
): Promise<CloudinaryMultipleUploadResponse> => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch("/api/upload/multiple", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Multiple upload error:", error);
    return {
      success: false,
      message: "Upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Delete image
export const deleteImage = async (
  publicId: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`/api/upload/${publicId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      message: "Delete failed",
    };
  }
};

// Generate Cloudinary URL with transformations
export const getCloudinaryUrl = (
  publicId: string,
  transformations?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): string => {
  const baseUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;

  if (transformations) {
    const transformString = Object.entries(transformations)
      .map(([key, value]) => `${key}_${value}`)
      .join(",");
    return `${baseUrl}/${transformString}/${publicId}`;
  }

  return `${baseUrl}/${publicId}`;
};
