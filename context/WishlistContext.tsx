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

      console.log("WishlistContext - Login Check:", {
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
        console.log("WishlistContext - Wishlist API response data:", data);

        if (data.wishlist && data.wishlist.length > 0) {
          // Convert wishlist items to Product format
          const wishlistItems = data.wishlist.map((item: any) => {
            console.log("WishlistContext - Processing wishlist item:", item);

            // Check if product is already populated
            if (
              item.productId &&
              typeof item.productId === "object" &&
              item.productId._id
            ) {
              // Product is populated, use it directly
              console.log("WishlistContext - Using populated product:", {
                productId: item.productId._id,
                product: item.productId,
                price: item.productId?.price,
                name: item.productId?.name,
              });
              return item.productId;
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
          console.log("WishlistContext - No items in wishlist");
          setWishlist([]);
        }
      } else {
        console.error(
          "WishlistContext - Failed to load wishlist:",
          response.status,
          response.statusText
        );
        const errorData = await response.json();
        console.error("WishlistContext - Error details:", errorData);
      }
    } catch (error) {
      console.error("WishlistContext - Error loading wishlist:", error);
    }
  };

  const addToWishlist = async (item: Product | any) => {
    console.log("WishlistContext - addToWishlist called:", {
      isLoggedIn,
      item: item?.name || "Unknown",
      itemId: getStableId(item),
    });

    if (!isLoggedIn) {
      console.log("WishlistContext - User not logged in, redirecting to login");
      // Redirect to login if not logged in
      if (typeof window !== "undefined") {
        window.location.href = "/account/login";
      }
      return;
    }

    try {
      const token = safeLocalStorage.getItem("token");
      const productId = getStableId(item);

      console.log("WishlistContext - Adding to database wishlist:", {
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

      console.log("WishlistContext - Removing from database wishlist:", {
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
