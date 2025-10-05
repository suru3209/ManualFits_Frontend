import { safeLocalStorage } from "./storage";
import { buildApiUrl } from "./api";

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return safeLocalStorage.getItem("token");
};

// Gift Cards API
export const giftCardApi = {
  // Get all gift cards
  getAll: async () => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/gift-cards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gift cards: ${response.statusText}`);
    }

    return response.json();
  },

  // Add new gift card
  add: async (giftCardData: {
    code: string;
    balance: string;
    expiry_date: string;
    is_active: boolean;
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/gift-cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(giftCardData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add gift card: ${response.statusText}`);
    }

    return response.json();
  },

  // Update gift card
  update: async (
    giftCardId: string,
    giftCardData: {
      code: string;
      balance: string;
      expiry_date: string;
      is_active: boolean;
    }
  ) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${buildApiUrl("/api/user")}/gift-cards/${giftCardId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(giftCardData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update gift card: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete gift card
  delete: async (giftCardId: string) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${buildApiUrl("/api/user")}/gift-cards/${giftCardId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete gift card: ${response.statusText}`);
    }

    return response.json();
  },
};

// UPI API
export const upiApi = {
  // Get all UPI
  getAll: async () => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/upi`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch UPI: ${response.statusText}`);
    }

    return response.json();
  },

  // Add new UPI
  add: async (upiData: {
    upi_id: string;
    name: string;
    is_default: boolean;
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/upi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(upiData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add UPI: ${response.statusText}`);
    }

    return response.json();
  },

  // Update UPI
  update: async (
    upiId: string,
    upiData: {
      upi_id: string;
      name: string;
      is_default: boolean;
    }
  ) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/upi/${upiId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(upiData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update UPI: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete UPI
  delete: async (upiId: string) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/upi/${upiId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete UPI: ${response.statusText}`);
    }

    return response.json();
  },
};

// Cards API
export const cardApi = {
  // Get all cards
  getAll: async () => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/cards`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cards: ${response.statusText}`);
    }

    return response.json();
  },

  // Add new card
  add: async (cardData: {
    card_type: string;
    brand: string;
    last4: string;
    expiry_month: string;
    expiry_year: string;
    cardholder_name: string;
    is_default: boolean;
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/cards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cardData),
    });

    if (!response.ok) {
      throw new Error(`Failed to add card: ${response.statusText}`);
    }

    return response.json();
  },

  // Update card
  update: async (
    cardId: string,
    cardData: {
      card_type: string;
      brand: string;
      last4: string;
      expiry_month: string;
      expiry_year: string;
      cardholder_name: string;
      is_default: boolean;
    }
  ) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${buildApiUrl("/api/user")}/cards/${cardId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cardData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update card: ${response.statusText}`);
    }

    return response.json();
  },

  // Delete card
  delete: async (cardId: string) => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(
      `${buildApiUrl("/api/user")}/cards/${cardId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete card: ${response.statusText}`);
    }

    return response.json();
  },
};

// User Payments API (for fetching all payment data)
export const userPaymentsApi = {
  // Get user profile with payment data
  getProfile: async () => {
    const token = getAuthToken();
    if (!token) throw new Error("No authentication token found");

    const response = await fetch(`${buildApiUrl("/api/user")}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return response.json();
  },
};
