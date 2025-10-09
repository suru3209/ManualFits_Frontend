// API configuration utility
export const getApiBaseUrl = (): string => {
  // Check if we're in development or production
  if (typeof window !== "undefined") {
    // Client-side: use environment variable or fallback
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl) return envUrl;

    // Development fallback
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:8080";
    }

    return "api.manualfits.com";
  }

  // Server-side: use environment variable or fallback
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;

  // Development fallback
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080";
  }

  return "api.manualfits.com";
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_BASE: "/api/auth",
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  PROFILE: "/api/user/profile",

  // User endpoints
  USER_ORDERS: "/api/user/orders",
  USER_WISHLIST: "/api/user/wishlist",
  USER_CART: "/api/user/cart",
  USER_ADDRESS: "/api/user/address",

  // Order endpoints
  ORDER_CANCEL: (orderId: string) => `/api/user/orders/${orderId}/cancel`,
  ORDER_RETURN_REPLACE: (orderId: string) =>
    `/api/user/orders/${orderId}/return-replace`,

  // Upload endpoints
  UPLOAD_SINGLE: "/api/upload/single",
  UPLOAD_MULTIPLE: "/api/upload/multiple",
  DELETE_UPLOAD: (publicId: string) => `/api/upload/${publicId}`,

  // Review endpoints
  REVIEWS_BASE: "/api/reviews",
  PRODUCT_REVIEWS: (productId: string) => `/api/reviews/product/${productId}`,
  USER_REVIEWS: "/api/reviews/user",
  REVIEW_CRUD: (reviewId: string) => `/api/reviews/${reviewId}`,
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};
