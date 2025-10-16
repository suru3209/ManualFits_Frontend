/**
 * API utility functions for building URLs and managing API endpoints
 */

// Base API URL - adjust based on environment
const getBaseUrl = (): string => {
  // Check for production environment
  const isProduction = process.env.NODE_ENV === "production";

  if (typeof window === "undefined") {
    // Server-side
    if (isProduction) {
      // In production, try to use environment variable or default to relative path
      return process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
    }
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  }

  // Client-side
  if (isProduction) {
    // In production, use environment variable or try to detect the backend URL
    const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl) {
      return envUrl;
    }

    // Try to construct backend URL from current domain
    const currentHost = window.location.hostname;
    const isLocalhost =
      currentHost === "localhost" || currentHost === "127.0.0.1";

    if (isLocalhost) {
      return "http://localhost:8080";
    } else {
      // For production, assume backend is on same domain with different port or subdomain
      return `https://api.${currentHost}`;
    }
  }

  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
};

/**
 * Builds a complete API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  if (!endpoint) {
    throw new Error("Endpoint cannot be undefined or empty");
  }
  const baseUrl = getBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * API endpoints constants
 */
export const API_ENDPOINTS = {
  // Auth base path
  AUTH_BASE: "/api/auth",

  // Auth endpoints
  LOGIN: "/api/auth/login",
  REGISTER: "/api/auth/register",
  LOGOUT: "/api/auth/logout",
  REFRESH: "/api/auth/refresh",

  // User endpoints
  PROFILE: "/api/user/profile",
  USER_ORDERS: "/api/user/orders",
  USER_CART: "/api/user/cart",
  USER_WISHLIST: "/api/user/wishlist",
  USER_ADDRESS: "/api/user/address",
  USER_PAYMENT: "/api/user/payment",
  USER_SUPPORT: "/api/user/support",
  ORDER_CANCEL: (orderId: string) => `/api/user/orders/${orderId}/cancel`,

  // Product endpoints
  PRODUCTS: "/products",
  PRODUCT_BY_ID: "/products",

  // Review endpoints
  REVIEWS: "/api/reviews",
  USER_REVIEWS: "/api/reviews/user",

  // Upload endpoints
  UPLOAD_SINGLE: "/api/upload/single",
  UPLOAD_MULTIPLE: "/api/upload/multiple",

  // Admin endpoints
  ADMIN: "/api/admin",

  // Chat endpoints
  CHAT: "/api/chat",

  // Support endpoints
  SUPPORT_TICKETS: "/api/support/tickets",
  SUPPORT_STATS: "/api/support/stats",
  SUPPORT_BASE: "/api/support",
  SUPPORT_CLOSE: (ticketId: string) => `/api/support/tickets/${ticketId}`,
} as const;

/**
 * Default fetch options for API calls
 */
export const defaultFetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include" as RequestCredentials,
};

/**
 * Enhanced fetch wrapper with error handling
 */
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const mergedOptions: RequestInit = {
    ...defaultFetchOptions,
    ...options,
    headers: {
      ...defaultFetchOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("API fetch error:", error);
    throw error;
  }
};
