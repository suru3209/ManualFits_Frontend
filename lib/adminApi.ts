// Admin API utility functions
export const getAdminApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
};

// Admin API endpoints
export const ADMIN_API_ENDPOINTS = {
  LOGIN: "/api/admin/login",
  DASHBOARD_STATS: "/api/admin/dashboard/stats",
  USERS: "/api/admin/users",
  ORDERS: "/api/admin/orders",
  ORDER_UPDATE_STATUS: (orderId: string) =>
    `/api/admin/orders/${orderId}/status`,
  PRODUCTS: "/api/admin/products",
  PRODUCT_UPDATE_STATUS: (productId: string) =>
    `/api/admin/products/${productId}/status`,
  REVIEWS: "/api/admin/reviews",
  DELETE_REVIEW: (reviewId: string) => `/api/admin/reviews/${reviewId}`,
  RETURN_REPLACE: "/api/admin/return-replace",
  UPDATE_RETURN_REPLACE_STATUS: (requestId: string) =>
    `/api/admin/return-replace/${requestId}/status`,
} as const;

// Helper function to build full API URLs
export const buildAdminApiUrl = (endpoint: string): string => {
  const baseUrl = getAdminApiBaseUrl();
  return `${baseUrl}${endpoint}`;
};

// Get admin token from localStorage
export const getAdminToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminToken");
  }
  return null;
};

// Get admin info from localStorage
export const getAdminInfo = () => {
  if (typeof window !== "undefined") {
    const adminInfo = localStorage.getItem("adminInfo");
    return adminInfo ? JSON.parse(adminInfo) : null;
  }
  return null;
};

// Admin API request helper
export const adminApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAdminToken();

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(buildAdminApiUrl(endpoint), {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      window.location.href = "/admin/login";
    }
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response;
};

// Admin API functions
export const adminApi = {
  // Authentication
  login: async (username: string, password: string) => {
    const response = await adminApiRequest(ADMIN_API_ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await adminApiRequest(ADMIN_API_ENDPOINTS.DASHBOARD_STATS);
    return response.json();
  },

  // Users
  getUsers: async (page = 1, limit = 10, search = "") => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    const response = await adminApiRequest(
      `${ADMIN_API_ENDPOINTS.USERS}?${params}`
    );
    return response.json();
  },

  // Orders
  getOrders: async (page = 1, limit = 10, status = "") => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    const response = await adminApiRequest(
      `${ADMIN_API_ENDPOINTS.ORDERS}?${params}`
    );
    return response.json();
  },

  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.ORDER_UPDATE_STATUS(orderId),
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );
    return response.json();
  },

  // Products
  getProducts: async (page = 1, limit = 10, search = "", category = "") => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });
    const response = await adminApiRequest(
      `${ADMIN_API_ENDPOINTS.PRODUCTS}?${params}`
    );
    return response.json();
  },

  updateProductStatus: async (productId: string, status: string) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.PRODUCT_UPDATE_STATUS(productId),
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );
    return response.json();
  },

  // Reviews
  getReviews: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await adminApiRequest(
      `${ADMIN_API_ENDPOINTS.REVIEWS}?${params}`
    );
    return response.json();
  },

  deleteReview: async (reviewId: string) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.DELETE_REVIEW(reviewId),
      {
        method: "DELETE",
      }
    );
    return response.json();
  },

  // Return/Replace
  getReturnReplaceRequests: async (page = 1, limit = 10, status = "") => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    const response = await adminApiRequest(
      `${ADMIN_API_ENDPOINTS.RETURN_REPLACE}?${params}`
    );
    return response.json();
  },

  updateReturnReplaceStatus: async (requestId: string, status: string) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.UPDATE_RETURN_REPLACE_STATUS(requestId),
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );
    return response.json();
  },
};
