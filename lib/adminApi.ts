// Admin API utility functions
export const getAdminApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
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
  PRODUCT: (productId: string) => `/api/admin/products/${productId}`,
  PRODUCT_UPDATE_STATUS: (productId: string) =>
    `/api/admin/products/${productId}/status`,
  REVIEWS: "/api/admin/reviews",
  DELETE_REVIEW: (reviewId: string) => `/api/admin/reviews/${reviewId}`,
  RETURN_REPLACE: "/api/admin/return-replace",
  UPDATE_RETURN_REPLACE_STATUS: (requestId: string) =>
    `/api/admin/return-replace/${requestId}/status`,
  HIDDEN_PRODUCTS: "/api/admin/hidden-products",
  // Admin Management endpoints
  ADMINS: "/api/admin/admins",
  CREATE_ADMIN: "/api/admin/create",
  UPDATE_ADMIN: (adminId: string) => `/api/admin/admins/${adminId}`,
  DELETE_ADMIN: (adminId: string) => `/api/admin/admins/${adminId}`,
  ADMIN_PERMISSIONS: "/api/admin/permissions",
  UPDATE_ADMIN_PERMISSIONS: (adminId: string) =>
    `/api/admin/admins/${adminId}/permissions`,
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
  console.log("Admin API Request - Token:", token ? "Present" : "Missing");
  console.log("Admin API Request - Endpoint:", endpoint);
  console.log("Admin API Request - Full URL:", buildAdminApiUrl(endpoint));

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

  console.log("Admin API Response - Status:", response.status);
  console.log("Admin API Response - OK:", response.ok);

  if (!response.ok) {
    if (response.status === 401) {
      console.log("Admin API - 401 Unauthorized, redirecting to login");
      // Token expired or invalid, redirect to login
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminInfo");
      window.location.href = "/admin/login";
    }
    const errorText = await response.text();
    console.log("Admin API Error Response:", errorText);
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
    try {
      const response = await fetch(
        buildAdminApiUrl(ADMIN_API_ENDPOINTS.LOGIN),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Login failed: ${response.status} ${response.statusText}`;

        // Create a more detailed error object
        const error = new Error(errorMessage) as Error & {
          status?: number;
          response?: Response;
        };
        error.status = response.status;
        error.response = response;

        throw error;
      }

      return response.json();
    } catch (error: unknown) {
      // If it's already our custom error, re-throw it
      const errorObj = error as { status?: number };
      if (errorObj.status) {
        throw error;
      }

      // Handle network errors or other issues
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Network error: ${errorMessage}`);
    }
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

  getProduct: async (productId: string) => {
    console.log("Admin API - Fetching product:", productId);
    console.log(
      "Admin API - Endpoint:",
      ADMIN_API_ENDPOINTS.PRODUCT(productId)
    );
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.PRODUCT(productId)
    );
    const data = await response.json();
    console.log("Admin API - Response:", data);
    return data;
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

  deleteProduct: async (productId: string) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.PRODUCT(productId),
      {
        method: "DELETE",
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

  // Hidden Products management
  getHiddenProducts: async () => {
    const response = await adminApiRequest(ADMIN_API_ENDPOINTS.HIDDEN_PRODUCTS);
    return response.json();
  },

  updateHiddenProducts: async (productNames: string[]) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.HIDDEN_PRODUCTS,
      {
        method: "POST",
        body: JSON.stringify({ productNames }),
      }
    );
    return response.json();
  },

  // Admin Management
  getAdmins: async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await adminApiRequest(
      `${ADMIN_API_ENDPOINTS.ADMINS}?${params}`
    );
    return response.json();
  },

  createAdmin: async (adminData: {
    username: string;
    email: string;
    password: string;
    role: string;
    permissions: string[];
  }) => {
    const response = await adminApiRequest(ADMIN_API_ENDPOINTS.CREATE_ADMIN, {
      method: "POST",
      body: JSON.stringify(adminData),
    });
    return response.json();
  },

  updateAdmin: async (
    adminId: string,
    adminData: {
      username?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    }
  ) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.UPDATE_ADMIN(adminId),
      {
        method: "PUT",
        body: JSON.stringify(adminData),
      }
    );
    return response.json();
  },

  deleteAdmin: async (adminId: string) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.DELETE_ADMIN(adminId),
      {
        method: "DELETE",
      }
    );
    return response.json();
  },

  getPermissions: async () => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.ADMIN_PERMISSIONS
    );
    return response.json();
  },

  updateAdminPermissions: async (adminId: string, permissions: string[]) => {
    const response = await adminApiRequest(
      ADMIN_API_ENDPOINTS.UPDATE_ADMIN_PERMISSIONS(adminId),
      {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }
    );
    return response.json();
  },
};
