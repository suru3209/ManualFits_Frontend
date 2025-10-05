// Profile image utility functions

export interface ProfileImageUpdateResponse {
  success: boolean;
  message: string;
  user?: {
    _id: string;
    username: string;
    email: string;
    phone: string;
    image: string;
    cloudinaryPublicId: string;
    dob?: string;
    gender?: string;
    addresses: unknown[];
    created_at: string;
    updated_at: string;
  };
  error?: string;
}

// Update user profile image
export const updateProfileImage = async (
  image: string,
  cloudinaryPublicId: string,
  token: string
): Promise<ProfileImageUpdateResponse> => {
  try {
    const response = await fetch("/api/user/profile/image", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image,
        cloudinaryPublicId,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Profile image update error:", error);
    return {
      success: false,
      message: "Update failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Remove profile image
export const removeProfileImage = async (
  token: string
): Promise<ProfileImageUpdateResponse> => {
  try {
    const response = await fetch("/api/user/profile/image", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: "",
        cloudinaryPublicId: "",
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Profile image removal error:", error);
    return {
      success: false,
      message: "Removal failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
