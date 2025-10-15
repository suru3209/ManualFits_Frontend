/**
 * Review API utilities for frontend
 */

import { buildApiUrl } from "./api";

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profilePic?: string;
  };
  product: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  likes: string[];
  likesCount: number;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  images?: string[];
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

/**
 * Create a new review
 */
export const createReview = async (
  reviewData: CreateReviewData
): Promise<Review> => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl("/api/reviews"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(reviewData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create review");
  }

  return response.json();
};

/**
 * Update an existing review
 */
export const updateReview = async (
  reviewId: string,
  updateData: UpdateReviewData
): Promise<Review> => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl(`/api/reviews/${reviewId}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update review");
  }

  return response.json();
};

/**
 * Delete a review
 */
export const deleteReview = async (reviewId: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl(`/api/reviews/${reviewId}`), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete review");
  }
};

/**
 * Check if user has already reviewed a product
 */
export const checkUserHasReviewed = async (
  productId: string
): Promise<boolean> => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch(
      buildApiUrl(`/api/reviews/user/${productId}`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    return data.hasReviewed;
  } catch (error) {
    console.error("Error checking user review:", error);
    return false;
  }
};

/**
 * Check if user can review a product (has purchased it and hasn't reviewed yet)
 */
export const checkUserCanReview = async (
  productId: string
): Promise<{ canReview: boolean; reason?: string }> => {
  const token = getAuthToken();
  if (!token) {
    return { canReview: false, reason: "Authentication required" };
  }

  try {
    const response = await fetch(
      buildApiUrl(`/api/reviews/can-review/${productId}`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        canReview: false,
        reason: error.message || "Cannot review this product",
      };
    }

    const data = await response.json();
    return { canReview: data.canReview, reason: data.reason };
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return { canReview: false, reason: "Error checking eligibility" };
  }
};

/**
 * Fetch reviews for a specific product
 */
export const fetchProductReviews = async (
  productId: string
): Promise<Review[]> => {
  const response = await fetch(
    buildApiUrl(`/api/reviews/product/${productId}`)
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch reviews");
  }

  const data = await response.json();
  return data.reviews || [];
};

/**
 * Toggle like on a review
 */
export const toggleReviewLike = async (
  reviewId: string
): Promise<{
  success: boolean;
  message: string;
  isLiked: boolean;
  likesCount: number;
}> => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl(`/api/reviews/${reviewId}/like`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to toggle like");
  }

  return response.json();
};

/**
 * Get user's reviews
 */
export const fetchUserReviews = async (): Promise<Review[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(buildApiUrl("/api/reviews/user"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user reviews");
  }

  const data = await response.json();
  return data.reviews || [];
};
