"use client";

import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  Star,
  Share2,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Shield,
  Check,
  // ChevronLeft,
  // ChevronRight,
  ShoppingBag,
  MessageCircle,
  Tag,
  Package,
  Users,
  Award,
  X,
  Edit,
  Trash2,
  // User,
} from "lucide-react";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import { useToast } from "../../../context/ToastContext";
import { buildApiUrl } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPage } from "@/components/ui/loading";
import {
  fetchProductReviews,
  createReview,
  updateReview,
  deleteReview,
  checkUserCanReview,
  toggleReviewLike,
  type Review,
} from "@/lib/reviewApi";
import { uploadMultipleImages } from "@/lib/cloudinary";
import { VariantPair } from "@/types/types";

// Product Type with new variant structure
type AnyProduct = {
  _id?: string;
  id?: number;
  name: string;
  title?: string;
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  variants?: VariantPair[];
  discount: number;
  discountPercent?: number;
  inStock: boolean;
  rating: number;
  reviews: number;
  reviewCount?: number;
  brand: string;
  description: string;
  totalStock?: number;
  // Legacy fields for backward compatibility
  colors?: string[];
  color?: string[];
  size?: string[];
  sizes?: any[]; // Keep for backward compatibility
};

async function fetchAllProducts(): Promise<AnyProduct[]> {
  const res = await fetch(buildApiUrl("/api/products"), { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

async function fetchSingleProduct(
  productId: string
): Promise<AnyProduct | null> {
  try {
    const res = await fetch(buildApiUrl(`/api/products/${productId}`), {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch product");
    }
    const json = await res.json();
    return json.data || json;
  } catch (error) {
    console.error("Error fetching single product:", error);
    return null;
  }
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  const { addToCart } = useCart();
  const {
    wishlist: wishlistItems,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();
  const { showToast } = useToast();
  const [product, setProduct] = useState<AnyProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlist, setWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<VariantPair | null>(
    null
  );
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    images: [] as string[],
  });
  // const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<AnyProduct[]>([]);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "description" | "reviews" | "specifications"
  >("description");

  // User authentication and purchase verification
  const [currentUser, setCurrentUser] = useState({
    id: "", // Will be set from localStorage or auth context
    name: "",
    email: "",
    profilePic: "",
  });
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Image popup state
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [allReviewImages, setAllReviewImages] = useState<
    Array<{
      src: string;
      reviewTitle: string;
      userName: string;
      reviewComment: string;
    }>
  >([]);
  const [canUserReview, setCanUserReview] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Helper functions for new variant system
  const getAvailableSizes = (): string[] => {
    if (!product?.variants) return [];
    return Array.from(
      new Set(product.variants.map((v) => v.size).filter(Boolean))
    );
  };

  const getAvailableColors = (size?: string): string[] => {
    if (!product?.variants) return [];
    const variants = size
      ? product.variants.filter((v) => v.size === size)
      : product.variants;
    return Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));
  };

  const getVariantData = (size: string, color: string): VariantPair | null => {
    if (!product?.variants) return null;
    return (
      product.variants.find((v) => v.size === size && v.color === color) || null
    );
  };

  const updateVariantSelection = (size: string, color: string) => {
    const variantData = getVariantData(size, color);
    if (variantData) {
      setSelectedVariant(variantData);
      setCurrentImageIndex(0); // Reset to first image
    } else {
      console.log("❌ VARIANT SELECTION - No variant found for:", {
        size,
        color,
      });
    }
  };

  const getCurrentImages = (): string[] => {
    if (selectedVariant?.images) {
      return selectedVariant.images;
    }
    return product?.images || [];
  };

  const getCurrentPrice = (): number => {
    return selectedVariant?.price || product?.price || 0;
  };

  const getCurrentOriginalPrice = (): number => {
    return selectedVariant?.originalPrice || product?.originalPrice || 0;
  };

  const getCurrentStock = (): number => {
    // If a specific variant is selected, check its availability
    if (selectedVariant) {
      return selectedVariant.isAvailable ? product?.totalStock || 0 : 0;
    }

    // If no variant selected, return product's totalStock
    return product?.totalStock || 0;
  };

  const getCurrentSKU = (): string => {
    return selectedVariant?.sku || `MF-${product?._id || product?.id}`;
  };

  // Helper functions
  const loadReviews = async () => {
    if (!stableId) {
      return;
    }

    setReviewsLoading(true);
    try {
      const reviews = await fetchProductReviews(String(stableId));
      setProductReviews(reviews);

      // Update product review count to match actual reviews
      setProduct((prev) =>
        prev ? { ...prev, reviews: reviews.length } : null
      );
    } catch (error) {
      console.error("🔍 Failed to load reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkUserEligibility = async () => {
    if (!stableId) {
      return;
    }

    try {
      const eligibility = await checkUserCanReview(String(stableId));
      setCanUserReview(eligibility.canReview);

      if (!eligibility.canReview) {
      }
    } catch (error) {
      console.error("🔍 Failed to check user eligibility:", error);
      setCanUserReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.title || !newReview.comment) {
      showToast("Please fill in all fields");
      return;
    }

    if (!canUserReview) {
      showToast("You can only review products you have purchased and received");
      return;
    }

    if (!product || !stableId) {
      showToast("Product not found");
      return;
    }

    setReviewSubmitting(true);
    try {
      const reviewData = {
        productId: String(stableId),
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: newReview.images,
      };

      console.log("🔍 Submitting review with data:", reviewData);
      console.log("🔍 Images being sent:", newReview.images);

      const newReviewData = await createReview(reviewData);
      console.log("🔍 Review created successfully:", newReviewData);
      if (newReviewData) {
        // Reload all reviews to ensure consistency
        await loadReviews();
        // Update product review count
        setProduct((prev) =>
          prev ? { ...prev, reviews: prev.reviews + 1 } : null
        );
        setNewReview({ rating: 5, title: "", comment: "", images: [] });
        setShowReviewModal(false);
        showToast("Review submitted successfully!");
      }
    } catch (error: unknown) {
      showToast((error as Error).message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setNewReview({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
    });
    setShowReviewModal(true);
  };

  const handleUpdateReview = async () => {
    if (!newReview.title || !newReview.comment) {
      showToast("Please fill in all fields");
      return;
    }

    if (!editingReview?._id) {
      showToast("Review not found");
      return;
    }

    setReviewSubmitting(true);
    try {
      const updateData = {
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
        images: newReview.images,
      };

      console.log("🔍 Updating review with data:", updateData);
      console.log("🔍 Images being sent for update:", newReview.images);

      const updatedReview = await updateReview(editingReview._id, updateData);
      console.log("🔍 Review updated successfully:", updatedReview);
      if (updatedReview) {
        // Reload all reviews to ensure consistency
        await loadReviews();
        setEditingReview(null);
        setNewReview({ rating: 5, title: "", comment: "", images: [] });
        setShowReviewModal(false);
        showToast("Review updated successfully!");
      }
    } catch (error: unknown) {
      showToast((error as Error).message || "Failed to update review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      // Reload all reviews to ensure consistency
      await loadReviews();
      // Update product review count
      setProduct((prev) =>
        prev ? { ...prev, reviews: Math.max(0, prev.reviews - 1) } : null
      );
      showToast("Review deleted successfully!");
    } catch (error: unknown) {
      showToast((error as Error).message || "Failed to delete review");
    }
  };

  const handleToggleLike = async (reviewId: string) => {
    try {
      const result = await toggleReviewLike(reviewId);
      setProductReviews((prev) =>
        prev.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                likes: result.isLiked
                  ? [...review.likes, currentUser.id]
                  : review.likes.filter((id) => id !== currentUser.id),
                likesCount: result.likesCount,
              }
            : review
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
      showToast("Failed to update like");
    }
  };

  // Function to get stock for selected size
  const getStockForSize = (size: string): number => {
    if (!product) return 0;

    // If a specific variant is selected, check its availability
    if (selectedVariant && selectedVariant.size === size) {
      return selectedVariant.isAvailable ? product.totalStock || 0 : 0;
    }

    // Return product's totalStock (stock is now at product level, not variant level)
    return product.totalStock || 0;
  };

  // Function to update stock in real-time
  const updateProductStock = async (size: string, newStock: number) => {
    if (!product || !stableId) return;

    try {
      setUpdatingStock(true);

      // Update local state immediately for better UX
      setProduct((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          // Update totalStock (stock is now at product level)
          totalStock: newStock,
        };
      });

      // In a real app, you would make an API call here to update the database
      // For now, we'll just update the local state
    } catch (error) {
      console.error("Error updating stock:", error);
      showToast("Failed to update stock");
    } finally {
      setUpdatingStock(false);
    }
  };

  // Handle image upload for reviews
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const maxImages = 4;
    const maxSizePerImage = 5 * 1024 * 1024; // 5MB in bytes

    // Check total image limit
    if (newReview.images.length + fileArray.length > maxImages) {
      showToast(
        `Maximum ${maxImages} images allowed. You can upload ${
          maxImages - newReview.images.length
        } more images.`
      );
      return;
    }

    // Check file size for each image
    const oversizedFiles = fileArray.filter(
      (file) => file.size > maxSizePerImage
    );
    if (oversizedFiles.length > 0) {
      showToast(
        `Some images are too large. Maximum size allowed is 5MB per image.`
      );
      return;
    }

    setIsUploadingImages(true);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showToast("Please login to upload images");
        return;
      }

      console.log("🔍 Uploading images:", fileArray.length, "files");
      const uploadResult = await uploadMultipleImages(fileArray, token);
      console.log("🔍 Upload result:", uploadResult);

      if (
        uploadResult &&
        uploadResult.success &&
        uploadResult.data?.successful
      ) {
        const uploadedUrls = uploadResult.data.successful.map(
          (item: any) => item.url
        );
        console.log("🔍 Uploaded URLs:", uploadedUrls);

        setNewReview((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        showToast(`${uploadedUrls.length} image(s) uploaded successfully`);
      } else {
        console.error("❌ Upload failed:", uploadResult);
        showToast("Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      showToast("Failed to upload images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  // const nextImage = () => {
  //   if (product?.images) {
  //     setCurrentImageIndex((prev) =>
  //       prev === product.images.length - 1 ? 0 : prev + 1
  //     );
  //   }
  // };

  // const prevImage = () => {
  //   if (product?.images) {
  //     setCurrentImageIndex((prev) =>
  //       prev === 0 ? product.images.length - 1 : prev - 1
  //     );
  //   }
  // };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Product link copied to clipboard!");
    }
  };

  useEffect(() => {
    // Initialize user information from localStorage
    const initializeUser = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setCurrentUser({
            id: parsedUser._id || parsedUser.id || "",
            name: parsedUser.name || "",
            email: parsedUser.email || "",
            profilePic: parsedUser.profilePic || "",
          });
        } else {
          // No user data found
          setCurrentUser({
            id: "",
            name: "",
            email: "",
            profilePic: "",
          });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        // No user data available
        setCurrentUser({
          id: "",
          name: "",
          email: "",
          profilePic: "",
        });
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        // First try to fetch single product directly
        const found = await fetchSingleProduct(String(routeId));

        if (!isMounted) return;

        if (found) {
          // Transform product data for new variant structure
          const transformedProduct = {
            ...found,
            // Map title to name for backward compatibility
            name: found.title || found.name,
            // Get first variant's price and images for display
            price: found.variants?.[0]?.price || found.price || 0,
            originalPrice:
              found.variants?.[0]?.originalPrice || found.originalPrice || 0,
            images: found.variants?.[0]?.images || found.images || [],
            // Get all unique colors from variants
            colors: found.variants?.map((v) => v.color) || found.colors || [],
            // Keep variants as is for new structure
            variants: found.variants || [],
            // Use discountPercent as discount
            discount: found.discountPercent || found.discount || 0,
            // Map reviewCount to reviews
            reviews: found.reviewCount || found.reviews || 0,
            // Ensure product has totalStock field
            totalStock: found.totalStock || 10, // Default stock if not provided
          };

          setProduct(transformedProduct);

          // Initialize with first available size and color
          const firstSize = found.variants?.[0]?.size || found.size?.[0] || "";
          const firstColor =
            found.variants?.[0]?.color ||
            found.colors?.[0] ||
            found.color?.[0] ||
            "";

          setSelectedSize(firstSize);
          setSelectedColor(firstColor);
          setCurrentImageIndex(0);

          // Initialize variant data
          if (firstSize && firstColor) {
            updateVariantSelection(firstSize, firstColor);
          }

          // Get related products from same category
          const all = await fetchAllProducts();
          const related = all
            .filter(
              (p) =>
                p.category === found.category &&
                String(
                  (p as unknown as AnyProduct)._id ??
                    (p as unknown as AnyProduct).id
                ) !== String(routeId)
            )
            .slice(0, 4)
            .map((product) => ({
              ...(product as unknown as AnyProduct),
              // Transform related products data for new variant structure
              name: product.title || product.name,
              price: product.variants?.[0]?.price || product.price || 0,
              originalPrice:
                product.variants?.[0]?.originalPrice ||
                product.originalPrice ||
                0,
              images: product.variants?.[0]?.images || product.images || [],
              colors:
                product.variants?.map((v) => v.color) || product.colors || [],
              variants: product.variants || [],
              discount: product.discountPercent || product.discount || 0,
              reviews: product.reviewCount || product.reviews || 0,
            }));
          setRelatedProducts(related);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error in product fetch:", error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [routeId]);

  // Separate useEffect for wishlist state
  useEffect(() => {
    if (product && wishlistItems) {
      const sid = String(
        (product as AnyProduct)._id ?? (product as AnyProduct).id
      );
      const inWishlist = wishlistItems.some(
        (p) => String((p as AnyProduct)._id ?? (p as AnyProduct).id) === sid
      );
      setWishlist(inWishlist);
    }
  }, [product, wishlistItems]);

  const stableId = useMemo(
    () => (product ? product._id ?? product.id : undefined),
    [product]
  );

  // Check user eligibility when both user and product are available
  useEffect(() => {
    if (currentUser.id && stableId) {
      checkUserEligibility();
    }
  }, [currentUser.id, stableId]);

  // Load reviews when product is available
  useEffect(() => {
    if (stableId) {
      loadReviews();
    }
  }, [stableId]);

  const handleAddToCart = () => {
    if (stableId) {
      // Check stock before adding to cart
      const totalStock = getCurrentStock();

      if (qty > totalStock) {
        showToast("Not enough stock available");
        return;
      }

      // Create cart item with variant-specific data
      const cartItem = {
        ...(product as AnyProduct),
        id: stableId,
        qty,
        selectedSize,
        selectedColor,
        selectedVariant: selectedVariant,
        price: getCurrentPrice(),
        originalPrice: getCurrentOriginalPrice(),
        images: getCurrentImages(),
        sku: getCurrentSKU(),
      };

      // Detailed console logging for add to cart
      console.log("🛒 ADD TO CART - Complete Product Object:", {
        productId: stableId,
        productName: product?.title || product?.name,
        productVariants: product?.variants, // Show all variants
        selectedVariant: selectedVariant,
        selectedSize: selectedSize,
        selectedColor: selectedColor,
        quantity: qty,
        price: getCurrentPrice(),
        originalPrice: getCurrentOriginalPrice(),
        sku: getCurrentSKU(),
        images: getCurrentImages(),
        fullCartItem: cartItem,
      });

      console.log("🛒 ADD TO CART - Variant Details:", {
        isVariantSelected: !!selectedVariant,
        variantSize: selectedVariant?.size,
        variantColor: selectedVariant?.color,
        variantPrice: selectedVariant?.price,
        variantStock: selectedVariant?.stock,
        variantAvailability: selectedVariant?.isAvailable,
        variantSKU: selectedVariant?.sku,
        variantImages: selectedVariant?.images,
        completeVariantObject: selectedVariant,
      });

      console.log(
        "🛒 ADD TO CART - All Available Variants:",
        product?.variants?.map((variant, index) => ({
          index: index,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          stock: variant.stock,
          isAvailable: variant.isAvailable,
          sku: variant.sku,
        }))
      );

      addToCart(cartItem);
      setAddedToCart(true);
      showToast("Product added to cart!");
    }
  };

  const handleBuyNow = () => {
    if (stableId) {
      // Check stock before buying
      const totalStock = getCurrentStock();

      if (qty > totalStock) {
        showToast("Not enough stock available");
        return;
      }

      // Create cart item with variant-specific data
      const cartItem = {
        ...(product as AnyProduct),
        id: stableId,
        qty,
        selectedSize,
        selectedColor,
        selectedVariant: selectedVariant,
        price: getCurrentPrice(),
        originalPrice: getCurrentOriginalPrice(),
        images: getCurrentImages(),
        sku: getCurrentSKU(),
      };

      addToCart(cartItem);
      router.push("/checkout");
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    const sid = (product as AnyProduct)._id ?? (product as AnyProduct).id;
    if (sid) {
      if (wishlist) {
        removeFromWishlist(sid);
        setWishlist(false);
        showToast("Removed from wishlist");
      } else {
        addToWishlist(product as unknown as AnyProduct);
        setWishlist(true);
        showToast("Added to wishlist!");
      }
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // Calculate actual rating from reviews
  const calculateActualRating = () => {
    if (productReviews.length === 0) return "0";
    const totalRating = productReviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );
    return (totalRating / productReviews.length).toFixed(1);
  };

  // Collect all review images for popup
  const collectAllReviewImages = () => {
    const images: Array<{
      src: string;
      reviewTitle: string;
      userName: string;
      reviewComment: string;
    }> = [];
    productReviews.forEach((review) => {
      if (review.images && review.images.length > 0) {
        review.images.forEach((image) => {
          images.push({
            src: image,
            reviewTitle: review.title,
            userName: review.user.name || "Anonymous",
            reviewComment: review.comment,
          });
        });
      }
    });
    setAllReviewImages(images);
  };

  // Handle image click to open popup
  const handleImageClick = (imageSrc: string) => {
    collectAllReviewImages();
    const imageIndex = allReviewImages.findIndex((img) => img.src === imageSrc);
    setSelectedImageIndex(imageIndex >= 0 ? imageIndex : 0);
    setShowImagePopup(true);
  };

  // Navigate through images in popup
  const navigateImage = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedImageIndex((prev) =>
        prev > 0 ? prev - 1 : allReviewImages.length - 1
      );
    } else {
      setSelectedImageIndex((prev) =>
        prev < allReviewImages.length - 1 ? prev + 1 : 0
      );
    }
  };

  const renderReviews = () => {
    console.log(
      "🔍 renderReviews called - productReviews.length:",
      productReviews.length
    );

    // Debug each review's user data
    productReviews.forEach((review, index) => {
      console.log(`🔍 Review ${index} user data:`, {
        _id: review.user._id,
        name: review.user.name,
        email: review.user.email,
        profilePic: review.user.profilePic,
      });

      // Ensure user data has fallbacks
      if (!review.user.name) {
        console.warn(`🔍 Review ${index} missing user name`);
      }
      if (!review.user.profilePic) {
        console.warn(`🔍 Review ${index} missing user profile pic`);
      }
    });

    if (reviewsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (productReviews.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No reviews yet. Be the first to review this product!
        </div>
      );
    }

    return productReviews.map((review) => (
      <Card key={review._id} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {review.user.profilePic ? (
                <img
                  src={review.user.profilePic}
                  alt={review.user.name || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(review.user.name || "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {review.user.name || "Anonymous User"}
                  </p>
                  {review.verified && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="w-3 h-3" />
                      <span>Verified Purchase</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(review.rating)}</div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            {/* Edit/Delete buttons for user's own reviews */}
            {review.user._id === currentUser.id && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditReview(review)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit review"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteReview(review._id!)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {/* Split Layout: Left Content, Right Images */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Written Content */}
            <div className="lg:col-span-2">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  {review.title}
                </h4>
                <p className="text-gray-700 mb-4">{review.comment}</p>

                {/* Like Button */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleLike(review._id!)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                      review.likes.includes(currentUser.id)
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        review.likes.includes(currentUser.id)
                          ? "fill-current"
                          : ""
                      }`}
                    />
                    <span>
                      {review.likesCount}{" "}
                      {review.likesCount === 1 ? "like" : "likes"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Images */}
            <div className="lg:col-span-1">
              {review.images && review.images.length > 0 ? (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">
                    Review Images
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {review.images.slice(0, 2).map((image, index) => (
                      <div
                        key={index}
                        className="relative group cursor-pointer"
                        onClick={() => handleImageClick(image)}
                      >
                        <img
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {review.images.length} image
                    {review.images.length > 1 ? "s" : ""} attached
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs">No images</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  if (isLoading) {
    return <LoadingPage message="Loading product details..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-500 mb-4">
              The product you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/products")} className="w-full">
              Browse Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:mt-16 mt-10">
      {/* Breadcrumb */}
      <div className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push("/")}
              className="text-muted-foreground hover:text-foreground"
            >
              Home
            </button>
            <span className="text-muted-foreground">/</span>
            <button
              onClick={() => router.push("/products")}
              className="text-muted-foreground hover:text-foreground"
            >
              Products
            </button>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">
              {product.category}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate max-w-xs">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Product Images Section */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative group">
              <div className="relative overflow-hidden bg-card shadow-lg border rounded-lg">
                <motion.img
                  key={
                    getCurrentImages()[currentImageIndex] ||
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                  }
                  src={
                    getCurrentImages()[currentImageIndex] ||
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                  }
                  alt={product.name}
                  className="w-full h-[600px] object-cover rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Thumbnail images */}
              {getCurrentImages().length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {getCurrentImages().map((img, index) => (
                    <motion.img
                      key={img}
                      src={
                        img ||
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                      }
                      alt="thumbnail"
                      className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${
                        currentImageIndex === index
                          ? "border-primary"
                          : "border-border"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-4">
            {/* Brand and Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {product.brand}
                </span>
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Premium Brand
                  </span>
                </div>
              </div>
              <motion.h1
                className="text-2xl lg:text-3xl font-bold text-foreground mb-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {product.name}
              </motion.h1>

              {/* Action buttons */}
              <div className="flex gap-2 mb-4">
                <motion.button
                  onClick={shareProduct}
                  className="bg-secondary hover:bg-secondary/80 rounded-full p-2 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Share2 className="w-5 h-5 text-secondary-foreground" />
                </motion.button>
                <motion.button
                  onClick={toggleWishlist}
                  className={`rounded-full p-2 transition-all ${
                    wishlist
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart
                    className={`w-5 h-5 ${wishlist ? "fill-current" : ""}`}
                  />
                </motion.button>
              </div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {renderStars(parseFloat(calculateActualRating()) || 0)}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {calculateActualRating()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{productReviews.length} reviews</span>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold text-foreground">
                  ₹{getCurrentPrice()}
                </span>
                {getCurrentOriginalPrice() > getCurrentPrice() && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{getCurrentOriginalPrice()}
                  </span>
                )}
              </div>
              {selectedVariant && (
                <div className="text-sm text-muted-foreground">
                  SKU: {getCurrentSKU()}
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {(() => {
                const currentStock = getCurrentStock();
                const isInStock = currentStock > 0;
                const hasSelectedVariant = selectedVariant !== null;

                return isInStock ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">In Stock</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-destructive">
                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                    <span className="text-sm font-medium">
                      {hasSelectedVariant
                        ? "Out of Stock"
                        : "No Stock Available"}
                    </span>
                  </div>
                );
              })()}
              <span className="text-sm text-muted-foreground">
                • Free shipping on orders over ₹999
              </span>
            </div>

            {/* Helpful message when no variant selected */}
            {!selectedVariant &&
              product?.variants &&
              product.variants.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>Select a size and color</strong> to see specific
                    stock availability and pricing for that variant.
                  </p>
                </div>
              )}

            {/* Size Selection */}
            {getAvailableSizes().length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Size
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {getAvailableSizes().map((size) => (
                    <motion.button
                      key={size}
                      onClick={() => {
                        setSelectedSize(size);
                        setQty(1);
                        // Reset color selection when size changes
                        const availableColors = getAvailableColors(size);
                        if (availableColors.length > 0) {
                          const firstColor = availableColors[0];
                          setSelectedColor(firstColor);
                          updateVariantSelection(size, firstColor);
                        }
                      }}
                      className={`px-3 py-2 border-2 rounded-lg font-medium transition-all text-sm ${
                        selectedSize === size
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-muted-foreground text-foreground"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {getAvailableColors(selectedSize).length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  Color
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {getAvailableColors(selectedSize).map((color) => {
                    // Find the variant for this color to get the colorCode
                    const variant = product?.variants?.find(
                      (v) => v.color === color
                    );
                    const colorCode = variant?.colorCode || "#cccccc";

                    return (
                      <motion.div
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          updateVariantSelection(selectedSize, color);
                        }}
                        className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all relative ${
                          selectedColor === color
                            ? "ring-4 ring-primary/20 border-primary"
                            : "border-border hover:border-muted-foreground"
                        }`}
                        style={{ backgroundColor: colorCode }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={color}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Quantity
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <motion.button
                    onClick={() => {
                      if (qty > 1) {
                        setQty(qty - 1);
                        // Update stock in real-time (increase by 1)
                        const totalStock = getStockForSize(selectedSize);
                        updateProductStock(selectedSize, totalStock + 1);
                      }
                    }}
                    disabled={qty <= 1 || updatingStock}
                    className={`px-3 py-2 transition-colors ${
                      qty <= 1 || updatingStock
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "hover:bg-muted"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="px-4 py-2 font-medium">{qty}</span>
                  <motion.button
                    onClick={() => {
                      const totalStock = getCurrentStock();
                      if (qty < totalStock) {
                        setQty(qty + 1);
                      } else {
                        showToast(
                          `Only ${totalStock} items available in stock`
                        );
                      }
                    }}
                    disabled={qty >= getCurrentStock()}
                    className={`px-3 py-2 transition-colors ${
                      qty >= getCurrentStock()
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "hover:bg-muted"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Availability Status Badge */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentStock = getCurrentStock();
                    const isInStock = currentStock > 0;

                    return isInStock ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        Out of Stock
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={getCurrentStock() === 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                    addedToCart
                      ? "bg-green-600 text-white"
                      : getCurrentStock() > 0
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  whileHover={getCurrentStock() > 0 ? { scale: 1.02 } : {}}
                  whileTap={getCurrentStock() > 0 ? { scale: 0.98 } : {}}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {addedToCart ? "Added to Cart" : "Add to Cart"}
                </motion.button>
                <motion.button
                  onClick={handleBuyNow}
                  disabled={getCurrentStock() === 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all ${
                    getCurrentStock() > 0
                      ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                  whileHover={getCurrentStock() > 0 ? { scale: 1.02 } : {}}
                  whileTap={getCurrentStock() > 0 ? { scale: 0.98 } : {}}
                >
                  Buy Now
                </motion.button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Free Shipping
                  </p>
                  <p className="text-xs text-muted-foreground">Over ₹999</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Easy Returns
                  </p>
                  <p className="text-xs text-muted-foreground">30-day policy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Secure Payment
                  </p>
                  <p className="text-xs text-muted-foreground">100% secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-8 lg:mt-16">
          <div className="border-b border-border">
            <nav className="flex flex-wrap space-x-4 sm:space-x-8">
              {[
                { id: "description", label: "Description", icon: Tag },
                {
                  id: "specifications",
                  label: "Specifications",
                  icon: Package,
                },
                { id: "reviews", label: "Reviews", icon: MessageCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as "description" | "reviews" | "specifications"
                    )
                  }
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            <AnimatePresence mode="wait">
              {activeTab === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-4">
                        Product Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Key Features
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            {(
                              product as unknown as { keyFeatures?: string[] }
                            ).keyFeatures?.map(
                              (feature: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4 text-green-500" />
                                  {feature}
                                </li>
                              )
                            ) || (
                              <p className="text-gray-500 text-sm">
                                No key features available
                              </p>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            Care Instructions
                          </h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            {(
                              product as unknown as {
                                careInstructions?: string[];
                              }
                            ).careInstructions?.map(
                              (instruction: string, index: number) => (
                                <li key={index}>• {instruction}</li>
                              )
                            ) || (
                              <p className="text-gray-500 text-sm">
                                No care instructions available
                              </p>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "specifications" && (
                <motion.div
                  key="specifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-xl font-semibold mb-4">
                        Product Specifications
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              Brand
                            </span>
                            <span className="text-gray-900">
                              {product.brand}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              Category
                            </span>
                            <span className="text-gray-900">
                              {product.category}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              Material
                            </span>
                            <span className="text-gray-900">
                              {(product as unknown as { material?: string })
                                .material || "Not specified"}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              Origin
                            </span>
                            <span className="text-gray-900">
                              {(product as unknown as { origin?: string })
                                .origin || "Not specified"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              Weight
                            </span>
                            <span className="text-gray-900">
                              {(product as unknown as { weight?: string })
                                .weight || "Not specified"}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              Warranty
                            </span>
                            <span className="text-gray-900">
                              {(product as unknown as { warranty?: string })
                                .warranty || "Not specified"}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              SKU
                            </span>
                            <span className="text-gray-900">
                              {(product as unknown as { sku?: string }).sku ||
                                `MF-${product.id || product._id}`}
                            </span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="font-medium text-gray-700">
                              Availability
                            </span>
                            <span
                              className={`font-medium ${
                                product.inStock
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional specifications from schema */}
                      {(() => {
                        const productSpecs = (
                          product as unknown as { specifications?: unknown[] }
                        ).specifications;
                        return (
                          productSpecs &&
                          productSpecs.length > 0 && (
                            <div className="mt-6">
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Additional Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {productSpecs.map(
                                  (spec: unknown, index: number) => {
                                    const specData = spec as {
                                      key?: string;
                                      value?: string;
                                    };
                                    return (
                                      <div
                                        key={index}
                                        className="flex justify-between py-2 border-b"
                                      >
                                        <span className="font-medium text-gray-700">
                                          {specData.key}
                                        </span>
                                        <span className="text-gray-900">
                                          {specData.value}
                                        </span>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )
                        );
                      })()}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    {/* Overall Rating Summary */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-semibold mb-2">
                              Customer Reviews
                            </h3>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {renderStars(
                                    parseFloat(calculateActualRating()) || 0
                                  )}
                                </div>
                                <span className="text-2xl font-bold">
                                  {calculateActualRating()}
                                </span>
                                <span className="text-gray-500">out of 5</span>
                              </div>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">
                                {productReviews.length} reviews
                              </span>
                            </div>
                          </div>
                          {canUserReview ? (
                            <Button
                              onClick={() => setShowReviewModal(true)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Write a Review
                            </Button>
                          ) : (
                            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                              Purchase this product and wait for delivery to
                              write a review
                            </div>
                          )}
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-2">
                          {[5, 4, 3, 2, 1].map((star) => {
                            // Calculate actual rating distribution from reviews
                            const starCount = productReviews.filter(
                              (review) => review.rating === star
                            ).length;
                            const totalReviews = productReviews.length;
                            const percentage =
                              totalReviews > 0
                                ? (starCount / totalReviews) * 100
                                : 0;

                            return (
                              <div
                                key={star}
                                className="flex items-center gap-3"
                              >
                                <span className="text-sm w-8">{star}</span>
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-yellow-400 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500 w-8">
                                  {starCount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Individual Reviews */}
                    <div>
                      <h4 className="text-lg font-semibold mb-4">
                        Recent Reviews
                      </h4>
                      {renderReviews()}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-8 lg:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <motion.div
                  key={relatedProduct._id || relatedProduct.id}
                  className="group cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/products/${relatedProduct._id || relatedProduct.id}`
                    )
                  }
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden">
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          relatedProduct.images?.[0] ||
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
                        }
                        alt={relatedProduct.name}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {relatedProduct.brand}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">
                            ₹{relatedProduct.price}
                          </span>
                          {relatedProduct.originalPrice >
                            relatedProduct.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ₹{relatedProduct.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            {relatedProduct.rating}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingReview ? "Edit Review" : "Write a Review"}
                </h3>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setEditingReview(null);
                    setNewReview({
                      rating: 5,
                      title: "",
                      comment: "",
                      images: [],
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setNewReview({ ...newReview, rating: star })
                        }
                        className="text-2xl"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newReview.rating
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="review-title"
                    className="text-sm font-medium text-gray-700"
                  >
                    Review Title
                  </Label>
                  <Input
                    id="review-title"
                    type="text"
                    value={newReview.title}
                    onChange={(e) =>
                      setNewReview({ ...newReview, title: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Summarize your experience"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="review-comment"
                    className="text-sm font-medium text-gray-700"
                  >
                    Your Review
                  </Label>
                  <textarea
                    id="review-comment"
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                    rows={4}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your experience with this product..."
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Review Images (Optional)
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Maximum 4 images, 5MB each
                  </p>
                  <div className="mt-1">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        handleImageUpload(e.target.files);
                      }}
                      disabled={isUploadingImages}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {isUploadingImages && (
                      <p className="text-sm text-blue-600 mt-1">
                        Uploading images...
                      </p>
                    )}
                    {newReview.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {newReview.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Review image ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => {
                                const newImages = newReview.images.filter(
                                  (_, i) => i !== index
                                );
                                setNewReview({
                                  ...newReview,
                                  images: newImages,
                                });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={
                      editingReview ? handleUpdateReview : handleSubmitReview
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={
                      !newReview.title || !newReview.comment || reviewSubmitting
                    }
                  >
                    {reviewSubmitting
                      ? "Submitting..."
                      : editingReview
                      ? "Update Review"
                      : "Submit Review"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReviewModal(false);
                      setEditingReview(null);
                      setNewReview({
                        rating: 5,
                        title: "",
                        comment: "",
                        images: [],
                      });
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Popup Modal - Simple and Clean */}
      {showImagePopup && allReviewImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setShowImagePopup(false)}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Username Above Image */}
            <div className="text-center mb-4">
              <p className="text-white text-lg font-medium">
                {allReviewImages[selectedImageIndex]?.userName}
              </p>
            </div>

            {/* Image Display */}
            <div className="relative">
              <img
                src={allReviewImages[selectedImageIndex]?.src}
                alt={`Review image ${selectedImageIndex + 1}`}
                className="w-full h-auto max-h-[60vh] object-contain rounded-lg"
              />

              {/* Navigation Arrows */}
              {allReviewImages.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage("prev")}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => navigateImage("next")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Comment Below Image */}
            <div className="text-center mt-4">
              <p className="text-white text-sm opacity-90 max-w-2xl mx-auto">
                &ldquo;{allReviewImages[selectedImageIndex]?.reviewComment}
                &rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
