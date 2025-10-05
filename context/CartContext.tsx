"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Product } from "../types/types";
import { safeLocalStorage } from "@/lib/storage";
import { buildApiUrl } from "@/lib/api";

export interface CartItem extends Product {
  qty: number;
  _id?: string; // MongoDB ObjectId as string
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem | any) => void;
  removeFromCart: (id: number | string) => void;
  increaseQty: (id: number | string) => void;
  decreaseQty: (id: number | string) => void;
  clearCart: () => void;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

      console.log("CartContext - Login Check:", {
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

  // Load cart from database when user logs in, or from localStorage for guests
  useEffect(() => {
    const loadCart = async () => {
      if (isLoggedIn) {
        await loadCartFromDatabase();
      } else {
        loadGuestCart();
      }
      setIsLoading(false);
    };

    loadCart();
  }, [isLoggedIn]);

  // Clear guest cart when user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      // Don't clear guest cart immediately, let it load from localStorage
      // This ensures guest cart persists when user logs out
    }
  }, [isLoggedIn]);

  // Load guest cart from localStorage
  const loadGuestCart = () => {
    try {
      const guestCart = safeLocalStorage.getItem("guestCart");
      if (guestCart && guestCart !== "undefined" && guestCart !== "null") {
        const cartData = JSON.parse(guestCart);
        setCartItems(cartData);
        console.log("CartContext - Guest cart loaded:", cartData);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Error loading guest cart:", error);
      setCartItems([]);
    }
  };

  // Save guest cart to localStorage
  const saveGuestCart = (cart: CartItem[]) => {
    try {
      safeLocalStorage.setItem("guestCart", JSON.stringify(cart));
      console.log("CartContext - Guest cart saved:", cart);
    } catch (error) {
      console.error("Error saving guest cart:", error);
    }
  };

  // Clear guest cart
  const clearGuestCart = () => {
    try {
      safeLocalStorage.removeItem("guestCart");
      setCartItems([]);
      console.log("CartContext - Guest cart cleared");
    } catch (error) {
      console.error("Error clearing guest cart:", error);
    }
  };

  const loadCartFromDatabase = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      console.log(
        "CartContext - Loading cart from database with token:",
        token ? "Present" : "Missing"
      );

      const response = await fetch(buildApiUrl("/api/user/cart"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("CartContext - Cart API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("CartContext - Cart API response data:", data);

        if (data.cart && data.cart.length > 0) {
          // Convert cart items to CartItem format
          const cartItems = data.cart.map((item: any) => {
            console.log("CartContext - Processing cart item:", item);

            // Check if product is already populated
            if (
              item.productId &&
              typeof item.productId === "object" &&
              item.productId._id
            ) {
              // Product is populated, use it directly
              console.log("CartContext - Using populated product:", {
                productId: item.productId._id,
                product: item.productId,
                price: item.productId?.price,
                name: item.productId?.name,
              });
              return { ...item.productId, qty: item.quantity };
            } else {
              // Product not populated, this shouldn't happen with proper populate
              console.warn(
                "CartContext - Product not populated for item:",
                item
              );
              return null;
            }
          });

          const validCartItems = cartItems.filter(Boolean);
          console.log("CartContext - Final cart items:", validCartItems);

          // Set cart items from database
          setCartItems(validCartItems);

          // Merge with guest cart if it exists
          await mergeGuestCart(validCartItems);
        } else {
          console.log("CartContext - No items in cart");
          setCartItems([]);
        }
      } else {
        console.error(
          "CartContext - Failed to load cart:",
          response.status,
          response.statusText
        );
        const errorData = await response.json();
        console.error("CartContext - Error details:", errorData);
      }
    } catch (error) {
      console.error("CartContext - Error loading cart:", error);
    }
  };

  // Merge guest cart with database cart
  const mergeGuestCart = async (dbCart: CartItem[]) => {
    try {
      const guestCart = safeLocalStorage.getItem("guestCart");
      if (guestCart && guestCart !== "undefined" && guestCart !== "null") {
        const guestCartData = JSON.parse(guestCart);
        console.log("CartContext - Merging guest cart:", guestCartData);

        // Add guest cart items to database
        for (const guestItem of guestCartData) {
          const productId = getStableId(guestItem);
          const token = safeLocalStorage.getItem("token");

          const response = await fetch(buildApiUrl("/api/user/cart"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              productId,
              quantity: guestItem.qty,
            }),
          });

          if (response.ok) {
            console.log("CartContext - Guest item merged:", guestItem.name);
          }
        }

        // Clear guest cart after merging
        safeLocalStorage.removeItem("guestCart");
        console.log("CartContext - Guest cart cleared after merge");

        // Reload cart from database
        await loadCartFromDatabase();
      } else {
        setCartItems(dbCart);
      }
    } catch (error) {
      console.error("Error merging guest cart:", error);
      setCartItems(dbCart);
    }
  };

  const addToCart = async (item: CartItem | any) => {
    console.log("CartContext - addToCart called:", {
      isLoggedIn,
      item: item?.name || "Unknown",
      itemId: getStableId(item),
    });

    if (!isLoggedIn) {
      // Guest user - add to localStorage
      const productId = getStableId(item);
      const existingItem = cartItems.find(
        (cartItem) => getStableId(cartItem) === productId
      );

      let updatedCart;
      if (existingItem) {
        updatedCart = cartItems.map((cartItem) =>
          getStableId(cartItem) === productId
            ? { ...cartItem, qty: cartItem.qty + (item.qty || 1) }
            : cartItem
        );
      } else {
        updatedCart = [...cartItems, { ...item, qty: item.qty || 1 }];
      }

      setCartItems(updatedCart);
      saveGuestCart(updatedCart);
      console.log("CartContext - Item added to guest cart:", updatedCart);
      return;
    }

    // Logged-in user - add to database
    try {
      const token = safeLocalStorage.getItem("token");
      const productId = getStableId(item);

      console.log("CartContext - Adding to database cart:", {
        productId,
        quantity: item.qty || 1,
        token: token ? "Present" : "Missing",
      });

      const response = await fetch(buildApiUrl("/api/user/cart"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity: item.qty || 1,
        }),
      });

      console.log(
        "CartContext - Add to cart response status:",
        response.status
      );

      if (response.ok) {
        console.log("CartContext - Item added to database cart successfully");
        // Reload cart from database
        await loadCartFromDatabase();
      } else {
        const errorData = await response.json();
        console.error("CartContext - Failed to add to cart:", errorData);
      }
    } catch (error) {
      console.error("CartContext - Error adding to cart:", error);
    }
  };

  const removeFromCart = async (id: number | string) => {
    if (!isLoggedIn) {
      // Guest user - remove from localStorage
      const updatedCart = cartItems.filter((item) => getStableId(item) !== id);
      setCartItems(updatedCart);
      saveGuestCart(updatedCart);
      console.log("CartContext - Item removed from guest cart");
      return;
    }

    // Logged-in user - remove from database
    try {
      const token = safeLocalStorage.getItem("token");

      const response = await fetch(buildApiUrl(`/api/user/cart/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Reload cart from database
        await loadCartFromDatabase();
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const increaseQty = async (id: number | string) => {
    if (!isLoggedIn) {
      // Guest user - increase quantity in localStorage
      const updatedCart = cartItems.map((item) =>
        getStableId(item) === id ? { ...item, qty: item.qty + 1 } : item
      );
      setCartItems(updatedCart);
      saveGuestCart(updatedCart);
      console.log("CartContext - Quantity increased in guest cart");
      return;
    }

    // Logged-in user - increase quantity in database
    try {
      const token = safeLocalStorage.getItem("token");

      const response = await fetch(buildApiUrl("/api/user/cart"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: id,
          quantity: 1,
        }),
      });

      if (response.ok) {
        await loadCartFromDatabase();
      }
    } catch (error) {
      console.error("Error increasing quantity:", error);
    }
  };

  const decreaseQty = async (id: number | string) => {
    if (!isLoggedIn) {
      // Guest user - decrease quantity in localStorage
      const updatedCart = cartItems.map((item) => {
        if (getStableId(item) === id) {
          const newQty = Math.max(1, item.qty - 1); // Don't go below 1
          return { ...item, qty: newQty };
        }
        return item;
      });
      setCartItems(updatedCart);
      saveGuestCart(updatedCart);
      console.log("CartContext - Quantity decreased in guest cart");
      return;
    }

    // Logged-in user - decrease quantity in database
    try {
      const token = safeLocalStorage.getItem("token");
      const currentItem = cartItems.find((item) => getStableId(item) === id);

      if (currentItem && currentItem.qty > 1) {
        const newQty = currentItem.qty - 1;

        const response = await fetch(buildApiUrl(`/api/user/cart/${id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: newQty }),
        });

        if (response.ok) {
          await loadCartFromDatabase();
        }
      }
    } catch (error) {
      console.error("Error decreasing quantity:", error);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isLoggedIn) {
      // Guest user - clear from localStorage
      setCartItems([]);
      clearGuestCart();
      console.log("CartContext - Guest cart cleared");
      return;
    }

    // Logged-in user - clear from database
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl("/api/user/cart"), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCartItems([]);
        console.log("CartContext - Database cart cleared");
      } else {
        console.error("Failed to clear cart from database");
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        clearCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
