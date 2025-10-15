"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Product } from "../types/types";
import { buildApiUrl } from "@/lib/api";
import { safeLocalStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (item: Product | any) => void;
  removeFromWishlist: (id: number | string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const getStableId = (item: any): string | number => item?._id ?? item?.id;

  // Check login status
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = safeLocalStorage.getItem("token");
      const user = safeLocalStorage.getItem("user");
      const isLoggedIn = !!(
        token &&
        user &&
        user !== "undefined" &&
        user !== "null"
      );

      console.log("WishlistContext - Login status check:", {
        token: token ? "Present" : "Missing",
        user: user ? "Present" : "Missing",
        userValue: user,
        tokenValue: token,
        isLoggedIn,
      });

      setIsLoggedIn(isLoggedIn);
    };

    checkLoginStatus();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") {
        checkLoginStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Load wishlist from database when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      loadWishlistFromDatabase();
    } else {
      setWishlist([]);
    }
  }, [isLoggedIn]);

  const loadWishlistFromDatabase = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      console.log(
        "WishlistContext - Loading wishlist from database with token:",
        token ? "Present" : "Missing"
      );

      // If no token, skip database loading
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl("/api/user/wishlist"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        "WishlistContext - Wishlist API response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();

        if (data.wishlist && data.wishlist.length > 0) {
          // Convert wishlist items to Product format
          const wishlistItems = data.wishlist.map((item: any) => {
            // Check if product is already populated
            if (
              item.productId &&
              typeof item.productId === "object" &&
              item.productId._id
            ) {
              // Product is populated, transform to new schema format
              const product = item.productId;
              const transformedProduct = {
                ...product,
                // Map new schema fields to old expected fields for backward compatibility
                name: product.title || product.name,
                price: product.variants?.[0]?.price || product.price || 0,
                originalPrice:
                  product.variants?.[0]?.originalPrice ||
                  product.originalPrice ||
                  0,
                images: product.variants?.[0]?.images || product.images || [],
              };

              console.log("WishlistContext - Transformed product:", {
                productId: product._id,
                title: product.title,
                name: transformedProduct.name,
                price: transformedProduct.price,
                variants: product.variants?.length || 0,
              });
              return transformedProduct;
            } else {
              // Product not populated, this shouldn't happen with proper populate
              console.warn(
                "WishlistContext - Product not populated for item:",
                item
              );
              return null;
            }
          });

          const validWishlistItems = wishlistItems.filter(Boolean);
          console.log(
            "WishlistContext - Final wishlist items:",
            validWishlistItems
          );
          setWishlist(validWishlistItems);
        } else {
          setWishlist([]);
        }
      } else {
        console.error(
          "WishlistContext - Failed to load wishlist:",
          response.status,
          response.statusText
        );

        try {
          const errorData = await response.json();
          console.error("WishlistContext - Error details:", errorData);

          // Handle specific error cases
          if (response.status === 401) {
            console.warn(
              "WishlistContext - Unauthorized, user may not be logged in"
            );
          } else if (response.status === 404) {
            console.warn(
              "WishlistContext - User not found, keeping existing wishlist"
            );
          } else {
            console.warn(
              "WishlistContext - Server error, keeping existing wishlist"
            );
          }
        } catch (parseError) {
          console.error(
            "WishlistContext - Could not parse error response:",
            parseError
          );
        }
      }
    } catch (error) {
      console.error("WishlistContext - Error loading wishlist:", error);

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.warn(
          "WishlistContext - Network error, keeping existing wishlist"
        );
      } else {
        console.warn(
          "WishlistContext - Unknown error, keeping existing wishlist"
        );
      }

      // Keep existing wishlist on any error
    }
  };

  const addToWishlist = async (item: Product | any) => {
    console.log("WishlistContext - Adding to wishlist:", {
      isLoggedIn,
      item: item?.name || "Unknown",
      itemId: getStableId(item),
    });

    if (!isLoggedIn) {
      // Redirect to login if not logged in
      if (typeof window !== "undefined") {
        window.location.href = "/account/login";
      }
      return;
    }

    try {
      const token = safeLocalStorage.getItem("token");
      const productId = getStableId(item);

      console.log("WishlistContext - Add request details:", {
        productId,
        token: token ? "Present" : "Missing",
      });

      const response = await fetch(buildApiUrl("/api/user/wishlist"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
        }),
      });

      console.log(
        "WishlistContext - Add to wishlist response status:",
        response.status
      );

      if (response.ok) {
        console.log(
          "WishlistContext - Item added to database wishlist successfully"
        );
        // Reload wishlist from database
        await loadWishlistFromDatabase();
      } else {
        const errorData = await response.json();
        console.error(
          "WishlistContext - Failed to add to wishlist:",
          errorData
        );
      }
    } catch (error) {
      console.error("WishlistContext - Error adding to wishlist:", error);
    }
  };

  const removeFromWishlist = async (id: number | string) => {
    if (!isLoggedIn) return;

    try {
      const token = safeLocalStorage.getItem("token");

      console.log("WishlistContext - Remove request details:", {
        productId: id,
        token: token ? "Present" : "Missing",
      });

      const response = await fetch(buildApiUrl(`/api/user/wishlist/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        "WishlistContext - Remove from wishlist response status:",
        response.status
      );

      if (response.ok) {
        console.log(
          "WishlistContext - Item removed from database wishlist successfully"
        );
        // Reload wishlist from database
        await loadWishlistFromDatabase();
      } else {
        const errorData = await response.json();
        console.error(
          "WishlistContext - Failed to remove from wishlist:",
          errorData
        );
      }
    } catch (error) {
      console.error("WishlistContext - Error removing from wishlist:", error);
    }
  };

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
