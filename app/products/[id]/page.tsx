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
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  MessageCircle,
  Tag,
  Package,
  Users,
  Award,
  X,
  Edit,
  Trash2,
  User,
} from "lucide-react";
import { useCart } from "../../../context/CartContext";
import { useWishlist } from "../../../context/WishlistContext";
import { useToast } from "../../../context/ToastContext";
import { buildApiUrl } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type AnyProduct = {
  _id?: string;
  id?: number;
  name: string;
  price: number;
  originalPrice: number;
  images: string[];
  category: string;
  colors?: string[];
  color?: string[];
  sizes?: { size: string; stock: number }[];
  size?: string[];
  discount: number;
  inStock: boolean;
  rating: number;
  reviews: number;
  brand: string;
  description: string;
};

async function fetchAllProducts(): Promise<AnyProduct[]> {
  const res = await fetch(buildApiUrl("/products"), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
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
  const [wishlist, setWishlist] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [, setMainImage] = useState<string | undefined>(undefined);
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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<AnyProduct[]>([]);
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

  // Helper functions
  const loadReviews = async () => {
    console.log("🔍 loadReviews called with stableId:", stableId);
    if (!stableId) {
      console.log("🔍 No stableId, returning early");
      return;
    }

    console.log("🔍 Setting reviewsLoading to true");
    setReviewsLoading(true);
    try {
      console.log("🔍 Loading reviews for product:", stableId);
      const reviews = await fetchProductReviews(String(stableId));
      console.log("🔍 Loaded reviews:", reviews);
      console.log("🔍 Setting productReviews to:", reviews);
      setProductReviews(reviews);

      // Update product review count to match actual reviews
      setProduct((prev) =>
        prev ? { ...prev, reviews: reviews.length } : null
      );
    } catch (error) {
      console.error("🔍 Failed to load reviews:", error);
    } finally {
      console.log("🔍 Setting reviewsLoading to false");
      setReviewsLoading(false);
    }
  };

  const checkUserEligibility = async () => {
    if (!stableId) {
      console.log("🔍 No stableId for eligibility check");
      return;
    }

    console.log("🔍 Checking user eligibility for product:", stableId);
    console.log("🔍 Current user:", currentUser);

    try {
      const eligibility = await checkUserCanReview(String(stableId));
      console.log("🔍 Eligibility response:", eligibility);
      setCanUserReview(eligibility.canReview);

      if (!eligibility.canReview) {
        console.log("🔍 User cannot review. Reason:", eligibility.reason);
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

      const newReviewData = await createReview(reviewData);
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

      const updatedReview = await updateReview(editingReview._id, updateData);
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

      const uploadResult = await uploadMultipleImages(fileArray, token);

      if (uploadResult.success && uploadResult.data) {
        const uploadedUrls = uploadResult.data.successful.map(
          (item) => item.url
        );
        setUploadedImages((prev) => [...prev, ...uploadedUrls]);
        setNewReview((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        showToast(`${uploadedUrls.length} image(s) uploaded successfully`);
      } else {
        showToast("Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      showToast("Failed to upload images");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const nextImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

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
        const all = await fetchAllProducts();
        const found = all.find(
          (p) => String((p as AnyProduct)._id ?? p.id) === String(routeId)
        );
        if (!isMounted) return;
        if (found) {
          setProduct(found);
          setSelectedSize(found.sizes?.[0]?.size || found.size?.[0] || "");
          setSelectedColor(found.colors?.[0] || found.color?.[0] || "");
          setMainImage(found.images?.[0]);
          setCurrentImageIndex(0);

          // Get related products from same category
          const related = all
            .filter(
              (p) =>
                p.category === found.category &&
                String((p as AnyProduct)._id ?? (p as AnyProduct).id) !==
                  String(routeId)
            )
            .slice(0, 4);
          setRelatedProducts(related);

          // initialize wishlist state based on context
          const sid = String(
            (found as AnyProduct)._id ?? (found as AnyProduct).id
          );
          const inWishlist = wishlistItems.some(
            (p) => String((p as AnyProduct)._id ?? (p as AnyProduct).id) === sid
          );
          setWishlist(inWishlist);

          // Reviews will be loaded when product is available via separate useEffect
          // checkUserEligibility will be called when currentUser is available
        } else {
          setProduct(null);
        }
      } catch {
        setProduct(null);
      } finally {
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [routeId, wishlistItems]);

  const stableId = useMemo(
    () => (product ? product._id ?? product.id : undefined),
    [product]
  );

  // Check user eligibility when both user and product are available
  useEffect(() => {
    if (currentUser.id && stableId) {
      console.log("🔍 Both user and product available, checking eligibility");
      checkUserEligibility();
    }
  }, [currentUser.id, stableId]);

  // Load reviews when product is available
  useEffect(() => {
    if (stableId) {
      console.log("🔍 Product available, loading reviews");
      loadReviews();
    }
  }, [stableId]);

  const handleAddToCart = () => {
    if (stableId) {
      addToCart({ ...(product as AnyProduct), id: stableId, qty });
      setAddedToCart(true);
      showToast("Product added to cart!");
    }
  };

  const handleBuyNow = () => {
    if (stableId) {
      addToCart({ ...(product as AnyProduct), id: stableId, qty });
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
        addToWishlist(product as AnyProduct);
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
    console.log("🔍 renderReviews called - reviewsLoading:", reviewsLoading);
    console.log("🔍 renderReviews called - productReviews:", productReviews);
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

  if (loading) {
    return (
      <div className="min-h-screen z-50 flex flex-col items-center justify-center bg-gray-50 fixed inset-0">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-xl mb-4">Loading Product...</p>
          <Progress value={63} className="opacity-70 w-64" />
        </div>
      </div>
    );
  }

  if (!product && !loading) {
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

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.push("/")}
              className="text-gray-500 hover:text-gray-700"
            >
              Home
            </button>
            <span className="text-gray-400">/</span>
            <button
              onClick={() => router.push("/products")}
              className="text-gray-500 hover:text-gray-700"
            >
              Products
            </button>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">
              {product.category}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate max-w-xs">
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
              <div className="relative overflow-hidden bg-white shadow-lg">
                <motion.img
                  key={product.images[currentImageIndex]}
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-[600px] object-cover"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Thumbnail images */}
              {product.images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {product.images.map((img, index) => (
                    <motion.img
                      key={img}
                      src={img}
                      alt="thumbnail"
                      className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${
                        currentImageIndex === index
                          ? "border-blue-500"
                          : "border-gray-200"
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
                <span className="text-sm font-medium text-gray-600">
                  {product.brand}
                </span>
                <div className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs text-gray-500">Premium Brand</span>
                </div>
              </div>
              <motion.h1
                className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2"
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
                  className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Share2 className="w-5 h-5 text-gray-700" />
                </motion.button>
                <motion.button
                  onClick={toggleWishlist}
                  className={`rounded-full p-2 transition-all ${
                    wishlist
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
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
                <span className="text-sm font-medium text-gray-700">
                  {calculateActualRating()}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{productReviews.length} reviews</span>
              </div>
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  ₹{product.price}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-lg text-gray-500 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">In Stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Out of Stock</span>
                </div>
              )}
              <span className="text-sm text-gray-500">
                • Free shipping on orders over ₹999
              </span>
            </div>

            {/* Size Selection */}
            {(product.size || product.sizes) && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Size
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {(
                    product.size ||
                    product.sizes?.map((s) => s.size) ||
                    []
                  ).map((s) => (
                    <motion.button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-2 border-2 rounded-lg font-medium transition-all text-sm ${
                        selectedSize === s
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-400 text-gray-700"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {(product.color || product.colors) && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  Color
                </h3>
                <div className="flex gap-2">
                  {(product.color || product.colors || []).map((c) => (
                    <motion.div
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                        selectedColor === c
                          ? "ring-4 ring-blue-200 border-blue-500"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: c.toLowerCase() }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Quantity
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <motion.button
                    onClick={() => qty > 1 && setQty(qty - 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  <span className="px-4 py-2 font-medium">{qty}</span>
                  <motion.button
                    onClick={() => setQty(qty + 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
                <span className="text-xs text-gray-500">
                  Only {Math.floor(Math.random() * 20) + 5} left in stock
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${
                    addedToCart
                      ? "bg-green-500 text-white"
                      : product.inStock
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  whileHover={product.inStock ? { scale: 1.02 } : {}}
                  whileTap={product.inStock ? { scale: 0.98 } : {}}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {addedToCart ? "Added to Cart" : "Add to Cart"}
                </motion.button>
                <motion.button
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-base transition-all ${
                    product.inStock
                      ? "bg-gray-900 hover:bg-black text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  whileHover={product.inStock ? { scale: 1.02 } : {}}
                  whileTap={product.inStock ? { scale: 0.98 } : {}}
                >
                  Buy Now
                </motion.button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Truck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    Free Shipping
                  </p>
                  <p className="text-xs text-gray-500">Over ₹999</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    Easy Returns
                  </p>
                  <p className="text-xs text-gray-500">30-day policy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    Secure Payment
                  </p>
                  <p className="text-xs text-gray-500">100% secure</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-8 lg:mt-16">
          <div className="border-b border-gray-200">
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
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
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
                        src={relatedProduct.images[0]}
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
