"use client";
import React, { useState } from "react";
import { ShoppingBag, Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";

export default function CartPage() {
  const { cartItems, increaseQty, decreaseQty, removeFromCart } = useCart();
  const { addToWishlist } = useWishlist();
  const { showToast } = useToast();
  const router = useRouter();
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>(
    {}
  );

  // Total calculations
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.price || 0) * item.qty,
    0
  );
  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const proceedToCheckout = () => {
    router.push("/checkout");
  };

  const moveToWishlist = async (item: any) => {
    try {
      console.log({
        itemId: item._id,
        itemName: item.name,
      });

      // Add to wishlist using context (this handles API call and updates context)
      addToWishlist(item);

      // Remove from cart using cart context - use correct ID
      await removeFromCart(item._id);

      showToast("Moved to wishlist");
    } catch (error) {
      console.error("Error moving to wishlist:", error);
      showToast("Failed to move to wishlist");
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="p-0 h-auto hover:bg-transparent"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Cart</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Your cart is empty
              </p>
              <p className="text-muted-foreground/70 mb-6">
                Add some items to get started
              </p>
              <Link
                href="/products"
                className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Breadcrumb with Back Button */}
          <div className="mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="p-0 h-auto hover:bg-transparent"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    Cart ({cartItems.length} items)
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cartItems.map((item: any, index: number) => (
              <div
                key={index}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 hover:shadow-md transition-shadow w-full"
              >
                <div className="space-y-3">
                  {/* Product Image */}
                  <div
                    className="w-full h-72 bg-muted rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const productId =
                        item.productId?._id || item.product?._id || item._id;
                      if (productId) {
                        router.push(`/products/${productId}`);
                      }
                    }}
                  >
                    {item.images && item.images.length > 0 ? (
                      <Image
                        src={item.images[0]}
                        alt={item.name || "Product"}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                        alt="No Image"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1">
                    <h3
                      className="font-semibold text-base line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        const productId =
                          item.productId?._id || item.product?._id || item._id;
                        if (productId) {
                          router.push(`/products/${productId}`);
                        }
                      }}
                    >
                      {item.name || "Product Name"}
                    </h3>
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {item.description || "Product description not available"}
                    </p>
                    <div className="flex items-center gap-1">
                      <p className="text-base font-bold text-primary">
                        ₹{item.price || "0"}
                      </p>
                      {item.originalPrice &&
                        item.originalPrice > item.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{item.originalPrice}
                          </p>
                        )}
                    </div>
                    {item.brand && (
                      <p className="text-xs text-primary/80 font-medium">
                        Brand: {item.brand}
                      </p>
                    )}
                    {item.selectedSize && item.selectedColor && (
                      <p className="text-xs text-gray-600">
                        Size: {item.selectedSize} | Color: {item.selectedColor}
                      </p>
                    )}
                    {item.selectedVariant && (
                      <p className="text-xs text-gray-600">
                        Stock: {item.selectedVariant.stock} available
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          loadingActions[`quantity-${item._id}`] ||
                          item.qty <= 1
                        }
                        onClick={async () => {
                          const productId = item._id;
                          console.log({
                            productId,
                            itemName: item.name,
                          });

                          setLoadingActions((prev) => ({
                            ...prev,
                            [`quantity-${item._id}`]: true,
                          }));

                          try {
                            await decreaseQty(productId);
                          } catch (error) {
                            console.error("Error updating quantity:", error);
                            showToast("Failed to update quantity");
                          } finally {
                            setLoadingActions((prev) => ({
                              ...prev,
                              [`quantity-${item._id}`]: false,
                            }));
                          }
                        }}
                        className="h-7 w-7 p-0"
                      >
                        -
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        {loadingActions[`quantity-${item._id}`]
                          ? "..."
                          : item.qty}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          loadingActions[`quantity-${item._id}`] ||
                          (item.selectedVariant &&
                            item.qty >= item.selectedVariant.stock)
                        }
                        title={
                          item.selectedVariant &&
                          item.qty >= item.selectedVariant.stock
                            ? `Only ${item.selectedVariant.stock} items available`
                            : "Increase quantity"
                        }
                        onClick={async () => {
                          const productId = item._id;
                          console.log({
                            productId,
                            itemName: item.name,
                          });

                          setLoadingActions((prev) => ({
                            ...prev,
                            [`quantity-${item._id}`]: true,
                          }));

                          try {
                            await increaseQty(productId);
                          } catch (error) {
                            console.error("Error updating quantity:", error);
                            showToast("Failed to update quantity");
                          } finally {
                            setLoadingActions((prev) => ({
                              ...prev,
                              [`quantity-${item._id}`]: false,
                            }));
                          }
                        }}
                        className="h-7 w-7 p-0"
                      >
                        +
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {/* Move to Wishlist Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingActions[`wishlist-${item._id}`]}
                        onClick={async () => {
                          const productId = item._id;

                          setLoadingActions((prev) => ({
                            ...prev,
                            [`wishlist-${item._id}`]: true,
                          }));

                          try {
                            await moveToWishlist(item);
                          } catch (error) {
                            console.error("Error moving to wishlist:", error);
                            showToast("Failed to move to wishlist");
                          } finally {
                            setLoadingActions((prev) => ({
                              ...prev,
                              [`wishlist-${item._id}`]: false,
                            }));
                          }
                        }}
                        className="text-xs px-2 py-1 text-primary hover:bg-primary/10 hover:text-primary p-2"
                        title="Move to Wishlist"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>

                      {/* Remove from Cart Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingActions[`remove-${item._id}`]}
                        onClick={async () => {
                          // Use the correct product ID - for cart items, use item._id directly
                          const productId = item._id;
                          console.log({
                            productId,
                            itemName: item.name,
                          });

                          setLoadingActions((prev) => ({
                            ...prev,
                            [`remove-${item._id}`]: true,
                          }));

                          try {
                            await removeFromCart(productId);
                            showToast("Item removed from cart");
                          } catch (error) {
                            console.error("Error removing from cart:", error);
                            showToast("Failed to remove item");
                          } finally {
                            setLoadingActions((prev) => ({
                              ...prev,
                              [`remove-${item._id}`]: false,
                            }));
                          }
                        }}
                        className="text-xs px-2 py-1 text-destructive hover:bg-destructive/10 hover:text-destructive p-2"
                        title="Remove from Cart"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      Total:
                    </span>
                    <span className="font-bold text-lg">
                      ₹{(item.price || 0) * item.qty}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-card rounded-lg border shadow-sm p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%):</span>
                <span>₹{tax}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={proceedToCheckout}
              className="w-full mt-4 bg-primary hover:bg-primary/90"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
