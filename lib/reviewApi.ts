import { buildApiUrl, API_ENDPOINTS } from "./api";

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined") {
    // For testing, use a mock token if no real token exists
    const token = localStorage.getItem("token");
    if (token) return token;

    // Mock token for testing (in real app, this would come from login)
    const mockToken = "mock-jwt-token-for-testing";
    localStorage.setItem("token", mockToken);
    return mockToken;
  }
  return null;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface Review {
  _id?: string;
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
  updatedAt?: string;
}

export interface CreateReviewData {
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

export interface UpdateReviewData {
  rating: number;
  title: string;
  comment: string;
  images?: string[];
}

// Fetch reviews for a specific product
export const fetchProductReviews = async (
  productId: string
): Promise<Review[]> => {
  try {
    const url = buildApiUrl(API_ENDPOINTS.PRODUCT_REVIEWS(productId));
    console.log("🔍 Fetching reviews from URL:", url);
    console.log("🔍 Auth headers:", getAuthHeaders());

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("🔍 Response status:", response.status);
    console.log("🔍 Response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔍 Error response:", errorText);
      throw new Error("Failed to fetch reviews");
    }

    const data = await response.json();
    console.log("🔍 API response data:", data);
    console.log("🔍 Reviews count:", data.reviews?.length || 0);
    return data.reviews || [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
};

// Create a new review
export const createReview = async (
  reviewData: CreateReviewData
): Promise<Review | null> => {
  try {
    const response = await fetch(buildApiUrl(API_ENDPOINTS.REVIEWS_BASE), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create review");
    }

    const data = await response.json();
    return data.review;
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
};

// Update an existing review
export const updateReview = async (
  reviewId: string,
  reviewData: UpdateReviewData
): Promise<Review | null> => {
  try {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.REVIEW_CRUD(reviewId)),
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(reviewData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update review");
    }

    const data = await response.json();
    return data.review;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
};

// Delete a review
export const deleteReview = async (reviewId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.REVIEW_CRUD(reviewId)),
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete review");
    }

    return true;
  } catch (error) {
    console.error("Error deleting review:", error);
    throw error;
  }
};

// Check if user can review a product (has purchased and received it)
export const checkUserCanReview = async (
  productId: string
): Promise<{ canReview: boolean; reason?: string }> => {
  try {
    const url = buildApiUrl(
      `${API_ENDPOINTS.REVIEWS_BASE}/can-review/${productId}`
    );
    console.log("🔍 Checking eligibility at URL:", url);
    console.log("🔍 Auth headers:", getAuthHeaders());

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("🔍 Eligibility response status:", response.status);
    console.log("🔍 Eligibility response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔍 Eligibility error response:", errorText);
      throw new Error("Failed to check review eligibility");
    }

    const data = await response.json();
    console.log("🔍 Eligibility response data:", data);
    return data;
  } catch (error) {
    console.error("🔍 Error checking review eligibility:", error);
    return { canReview: false, reason: "Unable to verify purchase status" };
  }
};

// Check if user has already reviewed a product
export const checkUserHasReviewed = async (
  productId: string
): Promise<{ hasReviewed: boolean; review?: Review }> => {
  try {
    // Since /api/reviews/user doesn't exist, we'll use a different approach
    // We'll try to fetch product reviews and check if current user has reviewed
    const url = buildApiUrl(API_ENDPOINTS.PRODUCT_REVIEWS(productId));
    console.log("🔍 Checking product reviews at URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error("🔍 Failed to fetch product reviews:", response.status);
      return { hasReviewed: false };
    }

    const data = await response.json();
    const reviews = data.reviews || [];
    console.log("🔍 Product reviews data:", reviews);

    // Get current user ID from localStorage
    const userData = localStorage.getItem("user");
    let currentUserId = "";
    if (userData) {
      try {
        const user = JSON.parse(userData);
        currentUserId = user._id || user.id || "";
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Find review by current user for this product
    const userReview = reviews.find(
      (review: Review) => review.user._id === currentUserId
    );

    if (userReview) {
      console.log(
        "🔍 Found existing review for product:",
        productId,
        userReview
      );
      return { hasReviewed: true, review: userReview };
    }

    return { hasReviewed: false };
  } catch (error) {
    console.error("🔍 Error checking user review:", error);
    return { hasReviewed: false };
  }
};

// Toggle like on a review
export const toggleReviewLike = async (
  reviewId: string
): Promise<{ isLiked: boolean; likesCount: number }> => {
  try {
    const response = await fetch(
      buildApiUrl(`${API_ENDPOINTS.REVIEWS_BASE}/${reviewId}/like`),
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to toggle like");
    }

    const data = await response.json();
    return {
      isLiked: data.isLiked,
      likesCount: data.likesCount,
    };
  } catch (error) {
    console.error("Error toggling review like:", error);
    throw error;
  }
};
