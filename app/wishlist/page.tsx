"use client";
import React, { useState } from "react";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { Heart, ShoppingBag, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const router = useRouter();
  const [clickedIcons, setClickedIcons] = useState<Record<string, boolean>>({});

  const moveToCart = async (product: any) => {
    try {
      // Add to cart using context (this handles API call and updates context)
      addToCart({ ...product, qty: 1 });

      // Remove from wishlist using context
      await removeFromWishlist(product._id || product.id);

      showToast("Item moved to cart");
    } catch (error) {
      console.error("Error moving to cart:", error);
      showToast("Failed to move item to cart");
    }
  };

  if (wishlist.length === 0) {
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
                  <BreadcrumbPage>Wishlist</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Your wishlist is empty
              </p>
              <p className="text-muted-foreground/70 mb-6">
                Add items to your wishlist to save them for later
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
                    Wishlist ({wishlist.length} items)
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlist.map((item: any) => (
              <div
                key={item._id || item.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-card"
              >
                <div
                  className="w-full h-48 bg-muted rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    const productId = item._id || item.id;
                    if (productId) {
                      router.push(`/products/${productId}`);
                    }
                  }}
                >
                  {item.images && item.images.length > 0 ? (
                    <Image
                      src={item.images[0]}
                      alt={item.name}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>

                <h3
                  className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary transition-colors line-clamp-2"
                  onClick={() => {
                    const productId = item._id || item.id;
                    if (productId) {
                      router.push(`/products/${productId}`);
                    }
                  }}
                >
                  {item.name}
                </h3>

                <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                  {item.description || "Product description not available"}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-lg text-primary">
                      ₹{item.price}
                    </p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className="text-xs text-muted-foreground line-through">
                        ₹{item.originalPrice}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const itemId = item._id || item.id;
                        setClickedIcons((prev) => ({
                          ...prev,
                          [`remove-${itemId}`]: true,
                        }));
                        removeFromWishlist(itemId);
                        showToast("Item removed from wishlist");
                        // Reset after animation
                        setTimeout(() => {
                          setClickedIcons((prev) => ({
                            ...prev,
                            [`remove-${itemId}`]: false,
                          }));
                        }, 300);
                      }}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive p-2 transition-all duration-200"
                      title="Remove from Wishlist"
                    >
                      <Heart
                        className={`h-4 w-4 transition-all duration-200 ${
                          clickedIcons[`remove-${item._id || item.id}`]
                            ? "fill-destructive scale-110"
                            : "fill-destructive hover:fill-destructive/80"
                        }`}
                      />
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        const itemId = item._id || item.id;
                        setClickedIcons((prev) => ({
                          ...prev,
                          [`cart-${itemId}`]: true,
                        }));
                        moveToCart(item);
                        // Reset after animation
                        setTimeout(() => {
                          setClickedIcons((prev) => ({
                            ...prev,
                            [`cart-${itemId}`]: false,
                          }));
                        }, 300);
                      }}
                      className="bg-primary hover:bg-primary/90 p-2 transition-all duration-200"
                      title="Move to Cart"
                    >
                      <ShoppingBag
                        className={`h-4 w-4 transition-all duration-200 ${
                          clickedIcons[`cart-${item._id || item.id}`]
                            ? "fill-primary-foreground scale-110"
                            : "hover:fill-primary-foreground"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
