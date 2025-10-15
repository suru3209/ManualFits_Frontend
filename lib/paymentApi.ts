/**
 * Payment API utilities for handling card and UPI payments
 */

import { buildApiUrl } from "./api";

// Mock payment APIs - replace with actual payment gateway integration

export const cardApi = {
  /**
   * Process card payment
   */
  processPayment: async (paymentData: {
    amount: number;
    currency: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  }) => {
    // Mock API call - replace with actual payment gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: `txn_${Date.now()}`,
          message: "Payment processed successfully",
        });
      }, 2000);
    });
  },

  /**
   * Get all saved cards for user
   */
  getAll: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(buildApiUrl("/api/user/cards"), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        cards: data.cards || [],
      };
    } catch (error) {
      console.error("Error fetching cards:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch cards",
        cards: [],
      };
    }
  },

  /**
   * Add new card
   */
  add: async (cardData: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(buildApiUrl("/api/user/cards"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || "Card added successfully",
        card: data.card,
      };
    } catch (error) {
      console.error("Error adding card:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add card",
      };
    }
  },

  /**
   * Validate card details
   */
  validateCard: (cardData: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  }) => {
    const { cardNumber, expiryMonth, expiryYear, cvv } = cardData;

    // Basic validation
    const isValidCardNumber = /^\d{16}$/.test(cardNumber.replace(/\s/g, ""));
    const isValidExpiry =
      /^\d{2}$/.test(expiryMonth) && /^\d{4}$/.test(expiryYear);
    const isValidCvv = /^\d{3,4}$/.test(cvv);

    return isValidCardNumber && isValidExpiry && isValidCvv;
  },
};

export const upiApi = {
  /**
   * Process UPI payment
   */
  processPayment: async (paymentData: {
    amount: number;
    upiId: string;
    merchantId?: string;
  }) => {
    // Mock API call - replace with actual UPI gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transactionId: `upi_${Date.now()}`,
          message: "UPI payment initiated successfully",
        });
      }, 1500);
    });
  },

  /**
   * Get all saved UPI IDs for user
   */
  getAll: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(buildApiUrl("/api/user/upi"), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        upi: data.upi || [],
      };
    } catch (error) {
      console.error("Error fetching UPI:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch UPI",
        upi: [],
      };
    }
  },

  /**
   * Add new UPI
   */
  add: async (upiData: any) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(buildApiUrl("/api/user/upi"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(upiData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || "UPI added successfully",
        upi: data.upi,
      };
    } catch (error) {
      console.error("Error adding UPI:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add UPI",
      };
    }
  },

  /**
   * Validate UPI ID
   */
  validateUpiId: (upiId: string) => {
    // Basic UPI ID validation
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/;
    return upiIdRegex.test(upiId);
  },

  /**
   * Get supported UPI apps
   */
  getSupportedApps: () => {
    return [
      { name: "Google Pay", id: "gpay", icon: "📱" },
      { name: "PhonePe", id: "phonepe", icon: "💳" },
      { name: "Paytm", id: "paytm", icon: "🏦" },
      { name: "BHIM", id: "bhim", icon: "🏛️" },
      { name: "Amazon Pay", id: "amazonpay", icon: "📦" },
    ];
  },
};
