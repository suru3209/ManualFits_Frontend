/**
 * Profile image management functions
 */

import { buildApiUrl } from "./api";

export interface ProfileImageUpdateResult {
  success: boolean;
  message?: string;
  user?: unknown;
}

/**
 * Update user's profile image
 */
export const updateProfileImage = async (
  imageUrl: string,
  publicId: string,
  token: string
): Promise<ProfileImageUpdateResult> => {
  try {
    const response = await fetch(buildApiUrl("/api/user/profile/image"), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: imageUrl,
        cloudinaryPublicId: publicId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to update profile image",
      };
    }

    return {
      success: true,
      user: result.user,
      message: result.message,
    };
  } catch (error) {
    console.error("Error updating profile image:", error);
    return {
      success: false,
      message: "Failed to update profile image. Please try again.",
    };
  }
};

/**
 * Remove user's profile image
 */
export const removeProfileImage = async (
  token: string
): Promise<ProfileImageUpdateResult> => {
  try {
    const response = await fetch(buildApiUrl("/api/user/profile/image"), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to remove profile image",
      };
    }

    return {
      success: true,
      user: result.user,
      message: result.message,
    };
  } catch (error) {
    console.error("Error removing profile image:", error);
    return {
      success: false,
      message: "Failed to remove profile image. Please try again.",
    };
  }
};
