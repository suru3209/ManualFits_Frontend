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
  selectedSize?: string;
  selectedColor?: string;
  selectedVariant?: any; // Variant object
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
                qty: item.quantity,
                // Add variant details
                selectedSize: item.size || product.variants?.[0]?.size,
                selectedColor: item.color || product.variants?.[0]?.color,
                selectedVariant: product.variants?.find(
                  (v: any) =>
                    v.size === (item.size || product.variants?.[0]?.size) &&
                    v.color === (item.color || product.variants?.[0]?.color)
                ),
              };

              console.log("CartContext - Using populated product:", {
                productId: product._id,
                title: product.title,
                name: transformedProduct.name,
                price: transformedProduct.price,
                variants: product.variants?.length || 0,
                selectedSize: transformedProduct.selectedSize,
                selectedColor: transformedProduct.selectedColor,
                selectedVariant: transformedProduct.selectedVariant,
              });
              return transformedProduct;
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

      // Handle connection errors
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error(
          "CartContext - Backend server connection failed, loading from localStorage"
        );
        // Load from localStorage as fallback
        const savedCart = safeLocalStorage.getItem("cart");
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart);
            setCartItems(cartData);
            console.log(
              "CartContext - Loaded cart from localStorage as fallback"
            );
          } catch (parseError) {
            console.error(
              "CartContext - Error parsing localStorage cart:",
              parseError
            );
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
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

    // Debug variant details
    console.log("CartContext - Item variant details:", {
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      selectedVariant: item.selectedVariant,
      price: item.price,
      originalPrice: item.originalPrice,
      sku: item.sku,
      images: item.images,
    });

    if (!isLoggedIn) {
      // Guest user - add to localStorage
      const productId = getStableId(item);
      const existingItem = cartItems.find(
        (cartItem) => getStableId(cartItem) === productId
      );

      let updatedCart;
      if (existingItem) {
        // Check if it's the same variant (same size and color)
        const isSameVariant =
          existingItem.selectedSize === item.selectedSize &&
          existingItem.selectedColor === item.selectedColor;

        if (isSameVariant) {
          // Check stock for same variant
          const newQty = existingItem.qty + (item.qty || 1);
          if (
            existingItem.selectedVariant &&
            newQty > existingItem.selectedVariant.stock
          ) {
            console.log(
              "CartContext - Insufficient stock for guest cart (same variant):",
              {
                requested: newQty,
                available: existingItem.selectedVariant.stock,
                variant: `${item.selectedSize}-${item.selectedColor}`,
              }
            );
            return; // Don't add if insufficient stock
          }

          updatedCart = cartItems.map((cartItem) =>
            getStableId(cartItem) === productId
              ? { ...cartItem, qty: newQty }
              : cartItem
          );
        } else {
          // Different variant, add as new item
          if (
            item.selectedVariant &&
            (item.qty || 1) > item.selectedVariant.stock
          ) {
            console.log(
              "CartContext - Insufficient stock for new guest cart variant:",
              {
                requested: item.qty || 1,
                available: item.selectedVariant.stock,
                variant: `${item.selectedSize}-${item.selectedColor}`,
              }
            );
            return; // Don't add if insufficient stock
          }

          updatedCart = [...cartItems, { ...item, qty: item.qty || 1 }];
        }
      } else {
        // New item - check stock
        if (
          item.selectedVariant &&
          (item.qty || 1) > item.selectedVariant.stock
        ) {
          console.log(
            "CartContext - Insufficient stock for new guest cart item:",
            {
              requested: item.qty || 1,
              available: item.selectedVariant.stock,
              variant: `${item.selectedSize}-${item.selectedColor}`,
            }
          );
          return; // Don't add if insufficient stock
        }

        updatedCart = [...cartItems, { ...item, qty: item.qty || 1 }];
      }

      console.log("CartContext - Final cart item being saved:", {
        ...item,
        qty: item.qty || 1,
      });

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
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
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
          size: item.selectedSize,
          color: item.selectedColor,
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

      // Handle specific error types
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        console.error(
          "CartContext - Backend server connection failed, falling back to localStorage"
        );
        // Fallback to localStorage for guest users
        const productId = getStableId(item);
        const existingItem = cartItems.find(
          (cartItem) => getStableId(cartItem) === productId
        );

        let updatedCart;
        if (existingItem) {
          updatedCart = cartItems.map((cartItem) =>
            getStableId(cartItem) === productId
              ? { ...cartItem, qty: (cartItem.qty || 1) + (item.qty || 1) }
              : cartItem
          );
        } else {
          updatedCart = [...cartItems, { ...item, qty: item.qty || 1 }];
        }

        setCartItems(updatedCart);
        saveGuestCart(updatedCart);
        console.log("CartContext - Item added to localStorage as fallback");
      }
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
      const item = cartItems.find((item) => getStableId(item) === id);
      if (!item) return;

      // Check stock before increasing
      const newQty = item.qty + 1;
      if (item.selectedVariant && newQty > item.selectedVariant.stock) {
        console.log(
          "CartContext - Cannot increase quantity, insufficient stock:",
          {
            requested: newQty,
            available: item.selectedVariant.stock,
            variant: `${item.selectedSize}-${item.selectedColor}`,
          }
        );
        return; // Don't increase if insufficient stock
      }

      const updatedCart = cartItems.map((item) =>
        getStableId(item) === id ? { ...item, qty: newQty } : item
      );
      setCartItems(updatedCart);
      saveGuestCart(updatedCart);
      console.log("CartContext - Quantity increased in guest cart");
      return;
    }

    // Logged-in user - increase quantity in database
    try {
      const token = safeLocalStorage.getItem("token");
      const cartItem = cartItems.find((item) => getStableId(item) === id);

      const response = await fetch(buildApiUrl("/api/user/cart"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: id,
          quantity: 1,
          size: cartItem?.selectedSize,
          color: cartItem?.selectedColor,
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
