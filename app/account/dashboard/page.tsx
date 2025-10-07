"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { safeLocalStorage } from "@/lib/storage";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import {
  createReview,
  updateReview,
  deleteReview,
  checkUserHasReviewed,
  fetchProductReviews,
  toggleReviewLike,
  type CreateReviewData,
  type Review,
} from "@/lib/reviewApi";
import { CartItem } from "@/context/CartContext";
import { uploadMultipleImages } from "@/lib/cloudinary";
// import jwt from "jsonwebtoken";
import {
  User,
  // Mail,
  // Phone,
  // Calendar,
  // MapPin,
  CreditCard,
  Gift,
  Edit3,
  // Camera,
  Settings,
  ShoppingBag,
  Star,
  Bell,
  LogOut,
  // Home,
  MapPin as AddressIcon,
  CreditCard as CardIcon,
  Smartphone,
  Ticket,
  Trash,
  X,
  MessageCircle,
} from "lucide-react";
import {
  GiftCardsSection,
  UPISection,
  SavedCardsSection,
} from "@/components/payment";
import DynamicBreadcrumb from "@/lib/breadcrumb";
import { Button } from "@/components/ui/button";
// import { SimpleProfileImageUpload } from "@/components/ui/SimpleProfileImageUpload";
import {
  PersonalInfoSection,
  EditProfileSection,
  ManageAddressesSection,
  MyOrdersSection,
  MyCartSection,
  CouponsSection,
  // ReviewsSection,
  NotificationsSection,
  CustomerSupportSection,
} from "@/components/dashboard";

interface Order {
  _id: string;
  createdAt: string;
  updatedAt?: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items: Array<{
    product: {
      _id?: string;
      id?: string;
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
}

interface Address {
  address_id: string;
  type: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: boolean;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  phone: string;
  image: string;
  cloudinaryPublicId?: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  addresses: Array<Address>;
  saved_payments: {
    upi: Array<{
      upi_id: string;
      name: string;
      is_default: boolean;
    }>;
    cards: Array<{
      card_id: string;
      card_type: string;
      brand: string;
      last4: string;
      expiry_month: number;
      expiry_year: number;
      cardholder_name: string;
      is_default: boolean;
    }>;
    gift_cards: Array<{
      giftcard_id: string;
      code: string;
      balance: number;
      expiry_date: string;
      is_active: boolean;
    }>;
  };
  created_at: string;
  updated_at: string;
}
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Progress } from "@/components/ui/progress";
// import { TrashIcon } from "@/components/ui/skiper-ui/skiper42";

export default function DashboardPage() {
  const { wishlist } = useWishlist();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [, setRecentOrders] = useState<Order[]>([]);
  const [token, setToken] = useState<string>("");
  const [activeSection, setActiveSection] = useState("personal-info");
  const [userAddresses, setUserAddresses] = useState<Address[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [profileImagePublicId, setProfileImagePublicId] = useState<string>("");
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    type: "Home",
    is_default: false,
  });
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userCart, setUserCart] = useState<CartItem[]>([]);
  // const [, setUserCoupons] = useState<unknown[]>([]);
  // const [, setUserNotifications] = useState<unknown[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [orderActionMessage, setOrderActionMessage] = useState<string>("");
  const [showTrackPopup, setShowTrackPopup] = useState(false);
  const [selectedOrderForTrack, setSelectedOrderForTrack] =
    useState<Order | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string>("");
  const [reviewProductName, setReviewProductName] = useState<string>("");
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: "",
    comment: "",
    images: [] as string[],
  });
  const [, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [orderReviews, setOrderReviews] = useState<Map<string, unknown>>(
    new Map()
  );
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);

  // Refs for content sections
  const personalInfoRef = useRef<HTMLDivElement>(null);
  const editProfileRef = useRef<HTMLDivElement>(null);
  const manageAddressesRef = useRef<HTMLDivElement>(null);
  const myOrdersRef = useRef<HTMLDivElement>(null);
  const myCartRef = useRef<HTMLDivElement>(null);
  const couponsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const giftCardsRef = useRef<HTMLDivElement>(null);
  const savedUpiRef = useRef<HTMLDivElement>(null);
  const savedCardsRef = useRef<HTMLDivElement>(null);
  const customerSupportRef = useRef<HTMLDivElement>(null);

  const router = useRouter();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Remove the aggressive scroll lock - allow normal page scrolling

  // Load existing reviews when userOrders changes
  useEffect(() => {
    if (userOrders && userOrders.length > 0) {
      loadExistingReviews(userOrders);
    }
  }, [userOrders]);

  // Load user reviews when reviews section is active
  useEffect(() => {
    if (activeSection === "reviews") {
      loadUserReviews();
    }
  }, [activeSection]);

  // Scroll to content function - ONLY for mobile devices
  const scrollToContent = (section: string) => {
    // Completely disable scroll on desktop - only work on mobile
    if (!isMobile) {
      console.log("Desktop mode: Scroll disabled");
      return;
    }

    console.log("Mobile mode: Scrolling to", section);
    const refs: { [key: string]: React.RefObject<HTMLDivElement | null> } = {
      "personal-info": personalInfoRef,
      "edit-profile": editProfileRef,
      "manage-addresses": manageAddressesRef,
      "my-orders": myOrdersRef,
      "my-cart": myCartRef,
      coupons: couponsRef,
      reviews: reviewsRef,
      notifications: notificationsRef,
      "gift-cards": giftCardsRef,
      "saved-upi": savedUpiRef,
      "saved-cards": savedCardsRef,
      "customer-support": customerSupportRef,
    };

    const targetRef = refs[section];
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Load existing reviews for delivered orders
  const loadExistingReviews = async (orders: Order[]) => {
    if (!orders || orders.length === 0) return;

    console.log("🔍 Loading existing reviews for orders:", orders.length);
    const reviewsMap = new Map<string, unknown>();

    try {
      // Since /api/reviews/user doesn't exist, we'll check each product individually
      // This is not ideal but works with existing backend
      for (const order of orders) {
        if (order.status === "delivered") {
          // Check if any product in this order has been reviewed
          for (const item of order.items) {
            const productId = item.product?._id || item.product?.id;
            if (productId) {
              try {
                // Use the existing checkUserHasReviewed function
                const reviewStatus = await checkUserHasReviewed(productId);
                if (reviewStatus.hasReviewed && reviewStatus.review) {
                  reviewsMap.set(order._id, reviewStatus.review);
                  console.log("🔍 Order has review:", order._id);
                  break; // One review per order, so we can break after finding one
                }
              } catch (error) {
                console.error(
                  `Error checking review for product ${productId}:`,
                  error
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("🔍 Error loading existing reviews:", error);
    }

    console.log("🔍 Final order reviews map:", reviewsMap);
    setOrderReviews(reviewsMap);
  };

  // Load user from localStorage and fetch from database
  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = safeLocalStorage.getItem("user");
      const currentToken = safeLocalStorage.getItem("token");

      if (!storedUser || !currentToken) {
        window.location.href = "/account/login";
        return;
      }

      // Validate token by testing it
      try {
        const testResponse = await fetch(buildApiUrl(API_ENDPOINTS.PROFILE), {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        if (!testResponse.ok) {
          // Token is invalid, clear storage and redirect
          safeLocalStorage.removeItem("token");
          safeLocalStorage.removeItem("user");
          window.location.href = "/account/login";
          return;
        }

        setToken(currentToken);
      } catch (error) {
        console.error("Token validation failed:", error);
        safeLocalStorage.removeItem("token");
        safeLocalStorage.removeItem("user");
        window.location.href = "/account/login";
        return;
      }

      if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setUserAddresses(userData.addresses || []);
        } catch (error) {
          console.error("Error parsing user data:", error);
          safeLocalStorage.removeItem("user");
        }
      }

      // Fetch complete user data from database
      await fetchUserProfile();

      // Fetch orders and cart for statistics
      await fetchUserOrders();
      await fetchUserCart();
    };

    loadUserData();
  }, []);

  // Fetch user profile from database
  const fetchUserProfile = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      if (!token) return;

      const response = await fetch(buildApiUrl(API_ENDPOINTS.PROFILE), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Dashboard - User profile data:", data.user);
        setUser(data.user);
        setUserAddresses(data.user.addresses || []);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Handle profile update
  // Handle profile image update
  const handleProfileImageUpdate = (url: string, publicId: string) => {
    console.log("Profile image updated:", { url, publicId });
    setProfileImageUrl(url);
    setProfileImagePublicId(publicId);
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = safeLocalStorage.getItem("token");
      if (!token) return;

      const formData = new FormData(e.currentTarget);
      const updateData = {
        username: formData.get("username"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        dob: formData.get("dob"),
        gender: formData.get("gender"),
        // Include profile image if updated
        ...(profileImageUrl && { image: profileImageUrl }),
        ...(profileImagePublicId && {
          cloudinaryPublicId: profileImagePublicId,
        }),
      };

      console.log("Dashboard - Updating profile with data:", updateData);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.PROFILE), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Dashboard - Profile updated successfully:", data.user);
        setUser(data.user);
        // Update localStorage
        safeLocalStorage.setItem("user", JSON.stringify(data.user));
        // Reset profile image state
        setProfileImageUrl("");
        setProfileImagePublicId("");
        setActiveSection("personal-info");
        console.log("Profile updated successfully!");
      } else {
        const errorData = await response.json();
        console.error("Dashboard - Profile update failed:", errorData);
        console.error("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Dashboard - Error updating profile:", error);
      console.error("Error updating profile. Please try again.");
    }
  };

  // Fetch user addresses from database
  const fetchUserAddresses = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_ADDRESS), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserAddresses(data.addresses || []);
        console.log("Dashboard - User addresses:", data.addresses);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_ORDERS), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        setUserOrders(orders);
        console.log("Dashboard - User orders:", orders);

        // Load existing reviews for delivered orders
        await loadExistingReviews(orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  // Fetch user cart
  const fetchUserCart = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_CART), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserCart(data.cart || []);
        console.log("Dashboard - User cart:", data.cart);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // Toggle order expansion
  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Filter orders by status
  const filteredOrders = userOrders.filter((order) => {
    if (orderStatusFilter === "all") return true;
    return order.status === orderStatusFilter;
  });

  // Get order status options from schema
  const orderStatusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
    { value: "returned", label: "Returned" },
    { value: "replaced", label: "Replaced" },
    { value: "refunded", label: "Refunded" },
    { value: "return/replace processing", label: "Return/Replace Processing" },
  ];

  // Handle order cancellation
  const handleCancelOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCancelConfirm(true);
  };

  // Handle return/replace request
  const handleReturnReplace = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowReturnConfirm(true);
  };

  // Handle track order
  const handleTrackOrder = (order: Order) => {
    setSelectedOrderForTrack(order);
    setShowTrackPopup(true);
  };

  // Review handlers - One review per order
  const handleWriteReview = async (orderId: string, orderItems: unknown[]) => {
    // For one review per order, we'll use the first product in the order
    const firstProduct = orderItems[0] as Order["items"][0];
    if (!firstProduct) return;

    const productId = firstProduct.product._id || firstProduct.product.id || "";
    const productName = firstProduct.product.name;

    setReviewProductId(productId);
    setReviewProductName(productName);

    // Set up for new review (no editing allowed)
    setEditingReview(null);
    setNewReview({
      rating: 5,
      title: "",
      comment: "",
      images: [],
    });

    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!newReview.title || !newReview.comment) {
      showToast("Please fill in all fields");
      return;
    }

    // Only check for product ID when creating a new review, not when editing
    if (!editingReview && !reviewProductId) {
      showToast("Product not found");
      return;
    }

    setReviewSubmitting(true);
    try {
      if (editingReview) {
        // Update existing review
        console.log("Updating review with ID:", editingReview._id);
        console.log("Review data:", {
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          images: newReview.images,
        });
        const updatedReview = await updateReview(editingReview._id!, {
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          images: newReview.images,
        });

        if (updatedReview) {
          // Update user reviews list
          setUserReviews((prev) =>
            prev.map((review) =>
              review._id === editingReview._id ? updatedReview : review
            )
          );
          setEditingReview(null);
          setNewReview({ rating: 5, title: "", comment: "", images: [] });
          setShowReviewModal(false);
          showToast("Review updated successfully!");
        }
      } else {
        // Create new review
        const reviewData: CreateReviewData = {
          productId: reviewProductId,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          images: newReview.images,
        };

        const newReviewData = await createReview(reviewData);
        if (newReviewData) {
          // Add to user reviews list
          setUserReviews((prev) => [newReviewData, ...prev]);

          // Find the order ID for this product and mark the order as reviewed
          const orderId = userOrders.find((order) => {
            return order.items.some((item) => {
              return (item.product._id || item.product.id) === reviewProductId;
            });
          })?._id;

          if (orderId) {
            // Update the order reviews map
            setOrderReviews(
              (prev) => new Map(prev.set(orderId, newReviewData))
            );
          }

          setNewReview({ rating: 5, title: "", comment: "", images: [] });
          setShowReviewModal(false);
          showToast("Review submitted successfully!");
        }
      }
    } catch (error: unknown) {
      showToast((error as Error).message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
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

  // Fetch user reviews
  const loadUserReviews = async () => {
    setLoadingUserReviews(true);
    try {
      const token = safeLocalStorage.getItem("token");
      if (!token) return;

      const response = await fetch(buildApiUrl("/api/reviews/user"), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("User reviews data:", data);
        setUserReviews(data.reviews || []);
      } else {
        console.error("Failed to fetch user reviews:", response.status);
        // If endpoint doesn't exist, we'll collect reviews from orders
        await loadReviewsFromOrders();
      }
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      // Fallback: collect reviews from orders
      await loadReviewsFromOrders();
    } finally {
      setLoadingUserReviews(false);
    }
  };

  // Fallback: Load reviews from user's orders
  const loadReviewsFromOrders = async () => {
    try {
      const allReviews: Review[] = [];

      for (const order of userOrders) {
        if (order.status === "delivered") {
          for (const item of order.items) {
            const productId = item.product._id || item.product.id;
            if (productId) {
              try {
                const productReviews = await fetchProductReviews(productId);
                const userReview = productReviews.find(
                  (review: Review) => review.user._id === user?._id
                );
                if (userReview) {
                  allReviews.push(userReview);
                }
              } catch (error) {
                console.error(
                  `Error fetching reviews for product ${productId}:`,
                  error
                );
              }
            }
          }
        }
      }

      console.log("Loaded reviews from orders:", allReviews);
      setUserReviews(allReviews);
    } catch (error) {
      console.error("Error loading reviews from orders:", error);
    }
  };

  // Handle delete user review
  const handleDeleteUserReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await deleteReview(reviewId);
      setUserReviews((prev) =>
        prev.filter((review) => review._id !== reviewId)
      );
      showToast("Review deleted successfully");
    } catch (error: unknown) {
      showToast((error as Error).message || "Failed to delete review");
    }
  };

  // Handle edit user review
  const handleEditUserReview = (review: Review) => {
    console.log("Editing review:", review);
    console.log("Review product:", review.product);
    setEditingReview(review);
    // Set the product ID for the review being edited
    const productId =
      typeof review.product === "object" && review.product !== null
        ? (review.product as { _id?: string; id?: string })?._id ||
          (review.product as { _id?: string; id?: string })?.id ||
          ""
        : (review.product as string) || "";
    const productName =
      typeof review.product === "object" && review.product !== null
        ? (review.product as { name?: string })?.name || "Product"
        : "Product";
    console.log("Setting product ID:", productId, "Product name:", productName);
    setReviewProductId(productId);
    setReviewProductName(productName);
    setNewReview({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
    });
    setShowReviewModal(true);
  };

  // Handle toggle like for user reviews
  const handleToggleLike = async (reviewId: string) => {
    try {
      const result = await toggleReviewLike(reviewId);
      if (result) {
        // Update user reviews list
        setUserReviews((prev) =>
          prev.map((review) =>
            review._id === reviewId
              ? {
                  ...review,
                  likes: result.isLiked
                    ? [...(review.likes || []), user?._id || ""]
                    : (review.likes || []).filter(
                        (id: string) => id !== user?._id
                      ),
                  likesCount: result.likesCount,
                }
              : review
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      showToast("Failed to update like");
    }
  };

  // Check if order is within 5-day return window
  const isWithinReturnWindow = (order: Order) => {
    if (order.status !== "delivered") return false;

    const deliveredDate = new Date(
      order.updatedAt || order.createdAt || new Date()
    );
    const currentDate = new Date();
    const daysDifference = Math.floor(
      (currentDate.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysDifference <= 5;
  };

  // Confirm order cancellation
  const confirmCancelOrder = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.ORDER_CANCEL(selectedOrderId)),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setOrderActionMessage("Your order was cancelled successfully!");
        await fetchUserOrders(); // Refresh orders
        setShowCancelConfirm(false);
        setSelectedOrderId("");
        // Clear message after 3 seconds
        setTimeout(() => setOrderActionMessage(""), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      console.error("Failed to cancel order. Please try again.");
    }
  };

  // Confirm return/replace request
  const confirmReturnReplace = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.ORDER_RETURN_REPLACE(selectedOrderId)),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setOrderActionMessage(
          "Your return/replace request was submitted successfully!"
        );
        await fetchUserOrders(); // Refresh orders
        setShowReturnConfirm(false);
        setSelectedOrderId("");
        // Clear message after 3 seconds
        setTimeout(() => setOrderActionMessage(""), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to submit return/replace request"
        );
      }
    } catch (error) {
      console.error("Error submitting return/replace request:", error);
      console.error(
        "Failed to submit return/replace request. Please try again."
      );
    }
  };

  // Fetch user orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        return;
      }
      try {
        const token = safeLocalStorage.getItem("token");
        const res = await fetch(buildApiUrl(API_ENDPOINTS.USER_ORDERS), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setRecentOrders(data.orders);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
      }
    };
    fetchOrders();
  }, [user]);

  const handleLogout = () => {
    safeLocalStorage.removeItem("user");
    safeLocalStorage.removeItem("token");
    safeLocalStorage.removeItem("guestCart"); // Clear guest cart on logout
    router.push("/account/login");
    // Force page refresh to clear localStorage and reset cart state
    window.location.reload();
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.USER_ADDRESS}/${addressId}/default`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchUserAddresses();
        console.log("Default address updated successfully!");
      } else {
        throw new Error("Failed to update default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      console.error("Failed to update default address. Please try again.");
    }
  };

  // Handle add new address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = safeLocalStorage.getItem("token");
      console.log("Dashboard - Adding address with data:", addressForm);
      console.log("Dashboard - Token:", token);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_ADDRESS), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });

      console.log("Dashboard - Address response status:", response.status);
      const responseData = await response.json();
      console.log("Dashboard - Address response data:", responseData);

      if (response.ok) {
        await fetchUserAddresses();
        setShowAddAddressForm(false);
        setAddressForm({
          name: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
          type: "Home",
          is_default: false,
        });
        console.log("Address added successfully!");
      } else {
        throw new Error("Failed to add address");
      }
    } catch (error) {
      console.error("Error adding address:", error);
      console.error("Failed to add address. Please try again.");
    }
  };

  // Handle edit address
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      name: address.name || "",
      phone: address.phone || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      zip: address.zip || "",
      country: address.country || "",
      type: address.type || "Home",
      is_default: address.is_default || false,
    });
    setShowAddAddressForm(true);
  };

  // Handle update address
  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddress) {
      console.error("No address selected for editing");
      return;
    }

    try {
      const token = safeLocalStorage.getItem("token");
      console.log("Dashboard - Updating address with data:", addressForm);
      console.log("Dashboard - Editing address ID:", editingAddress.address_id);
      console.log("Dashboard - Token:", token);

      const response = await fetch(
        buildApiUrl(
          `${API_ENDPOINTS.USER_ADDRESS}/${editingAddress.address_id}`
        ),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addressForm),
        }
      );

      console.log(
        "Dashboard - Update address response status:",
        response.status
      );
      const responseData = await response.json();
      console.log("Dashboard - Update address response data:", responseData);

      if (response.ok) {
        await fetchUserAddresses();
        setShowAddAddressForm(false);
        setEditingAddress(null);
        setAddressForm({
          name: "",
          phone: "",
          street: "",
          city: "",
          state: "",
          zip: "",
          country: "",
          type: "Home",
          is_default: false,
        });
        console.log("Address updated successfully!");
      } else {
        throw new Error("Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      console.error("Failed to update address. Please try again.");
    }
  };

  // Handle delete address
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.USER_ADDRESS}/${addressId}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchUserAddresses();
        console.log("Address deleted successfully!");
      } else {
        throw new Error("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      console.error("Failed to delete address. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">
          You must{" "}
          <Link href="/account/login" className="text-gray-500 font-semibold">
            login
          </Link>{" "}
          to view your dashboard.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex flex-col lg:flex-row min-h-screen bg-gray-100"
        style={{ scrollBehavior: "auto" }}
      >
        {/* Left Navigation */}
        <div className="w-full lg:w-1/4 bg-white shadow-lg">
          <div className="p-4 sm:p-6">
            {/* User Profile */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 mb-6 pb-4 border-b">
              <div className="w-16 h-16 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user.image && user.image.trim() !== "" ? (
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 text-gray-400 flex items-center justify-center">
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-gray-900 text-lg sm:text-base">
                  {user?.username}
                </h3>
                <p className="text-sm text-gray-600 break-all">{user?.email}</p>
              </div>
            </div>

            {/* Account Settings */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("account-settings")}
                className="flex items-center justify-between w-full text-gray-700 font-semibold mb-3 p-2 sm:p-3 rounded hover:bg-gray-100 text-sm sm:text-base"
              >
                <div className="flex items-center">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="hidden sm:inline">Account Settings</span>
                  <span className="sm:hidden">Account</span>
                </div>
                <span
                  className={`transform transition-transform ${
                    expandedSections.includes("account-settings")
                      ? "rotate-180"
                      : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {expandedSections.includes("account-settings") && (
                <div className="ml-2 sm:ml-7 space-y-2">
                  <button
                    onClick={() => {
                      setActiveSection("personal-info");
                      scrollToContent("personal-info");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded text-sm sm:text-base ${
                      activeSection === "personal-info"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <User className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Personal Info</span>
                    <span className="sm:hidden">Personal</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection("manage-addresses");
                      scrollToContent("manage-addresses");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded text-sm sm:text-base ${
                      activeSection === "manage-addresses"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <AddressIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Manage Addresses</span>
                    <span className="sm:hidden">Addresses</span>
                  </button>
                </div>
              )}
            </div>

            {/* My Orders */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setActiveSection("my-orders");
                  fetchUserOrders();
                  scrollToContent("my-orders");
                }}
                className={`flex items-center w-full text-left p-2 sm:p-3 rounded font-semibold text-sm sm:text-base ${
                  activeSection === "my-orders"
                    ? "bg-gray-100 text-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">My Orders</span>
                <span className="sm:hidden">Orders</span>
              </button>
            </div>

            {/* My Cart */}
            <div className="mb-6">
              <button
                onClick={() => {
                  setActiveSection("my-cart");
                  fetchUserCart();
                  scrollToContent("my-cart");
                }}
                className={`flex items-center w-full text-left p-2 sm:p-3 rounded font-semibold text-sm sm:text-base ${
                  activeSection === "my-cart"
                    ? "bg-gray-100 text-gray-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">
                  My Cart ({userCart.length})
                </span>
                <span className="sm:hidden">Cart ({userCart.length})</span>
              </button>
            </div>

            {/* Mine */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("mine")}
                className="flex items-center justify-between w-full text-gray-700 font-semibold mb-3 p-2 rounded hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Mine
                </div>
                <span
                  className={`transform transition-transform ${
                    expandedSections.includes("mine") ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {expandedSections.includes("mine") && (
                <div className="ml-7 space-y-2">
                  <button
                    onClick={() => {
                      setActiveSection("coupons");
                      scrollToContent("coupons");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded ${
                      activeSection === "coupons"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Ticket className="w-4 h-4 mr-2" />
                    Coupons
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection("reviews");
                      scrollToContent("reviews");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded ${
                      activeSection === "reviews"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Star className="w-4 h-4 mr-2" />
                    Reviews & Ratings
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection("notifications");
                      scrollToContent("notifications");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded ${
                      activeSection === "notifications"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </button>
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="mb-6">
              <button
                onClick={() => toggleSection("payments")}
                className="flex items-center justify-between w-full text-gray-700 font-semibold mb-3 p-2 rounded hover:bg-gray-100"
              >
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payments
                </div>
                <span
                  className={`transform transition-transform ${
                    expandedSections.includes("payments") ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>
              {expandedSections.includes("payments") && (
                <div className="ml-7 space-y-2">
                  <button
                    onClick={() => {
                      setActiveSection("gift-cards");
                      scrollToContent("gift-cards");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded ${
                      activeSection === "gift-cards"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Gift Cards
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection("saved-upi");
                      scrollToContent("saved-upi");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded ${
                      activeSection === "saved-upi"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Saved UPI
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection("saved-cards");
                      scrollToContent("saved-cards");
                    }}
                    className={`flex items-center w-full text-left p-2 rounded ${
                      activeSection === "saved-cards"
                        ? "bg-gray-100 text-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <CardIcon className="w-4 h-4 mr-2" />
                    Saved Cards
                  </button>
                </div>
              )}
            </div>

            {/* Customer Support */}
            <button
              onClick={() => {
                setActiveSection("customer-support");
                // No scroll behavior for customer support on any device
                console.log("Customer support clicked - no scroll");
              }}
              className={`flex items-center w-full text-left p-2 rounded font-semibold text-sm sm:text-base mb-4 ${
                activeSection === "customer-support"
                  ? "bg-blue-100 text-blue-700"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Customer Support</span>
              <span className="sm:hidden">Support</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left p-2 rounded text-red-600 hover:bg-red-50 font-semibold"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 p-2 sm:p-4 lg:p-6">
          <div className="-mt-3 mb-3">
            <DynamicBreadcrumb />
          </div>
          {activeSection === "personal-info" && (
            <div ref={personalInfoRef}>
              <PersonalInfoSection
                user={user}
                userOrders={userOrders}
                userWishlists={wishlist}
                userCart={userCart}
                onEditProfile={() => setActiveSection("edit-profile")}
              />
            </div>
          )}

          {activeSection === "edit-profile" && (
            <div ref={editProfileRef}>
              <EditProfileSection
                user={user}
                token={token || safeLocalStorage.getItem("token") || ""}
                profileImageUrl={profileImageUrl}
                profileImagePublicId={profileImagePublicId}
                onUpdateProfile={handleUpdateProfile}
                onCancel={() => setActiveSection("personal-info")}
                onProfileImageUpdate={handleProfileImageUpdate}
                onResetProfileImage={() => {
                  setActiveSection("personal-info");
                  setProfileImageUrl("");
                  setProfileImagePublicId("");
                }}
              />
            </div>
          )}

          {activeSection === "manage-addresses" && (
            <div ref={manageAddressesRef}>
              <ManageAddressesSection
                userAddresses={userAddresses}
                showAddAddressForm={showAddAddressForm}
                editingAddress={editingAddress}
                addressForm={addressForm}
                onAddAddress={() => {
                  setEditingAddress(null);
                  setAddressForm({
                    name: "",
                    phone: "",
                    street: "",
                    city: "",
                    state: "",
                    zip: "",
                    country: "",
                    type: "Home",
                    is_default: false,
                  });
                  setShowAddAddressForm(true);
                }}
                onEditAddress={handleEditAddress}
                onUpdateAddress={handleUpdateAddress}
                onAddAddressSubmit={handleAddAddress}
                onDeleteAddress={handleDeleteAddress}
                onSetDefaultAddress={handleSetDefaultAddress}
                onAddressFormChange={(field, value) =>
                  setAddressForm({ ...addressForm, [field]: value })
                }
                onCancelAddressForm={() => {
                  setShowAddAddressForm(false);
                  setEditingAddress(null);
                  setAddressForm({
                    name: "",
                    phone: "",
                    street: "",
                    city: "",
                    state: "",
                    zip: "",
                    country: "",
                    type: "Home",
                    is_default: false,
                  });
                }}
              />
            </div>
          )}

          {activeSection === "my-orders" && (
            <div ref={myOrdersRef}>
              <MyOrdersSection
                filteredOrders={filteredOrders}
                orderStatusFilter={orderStatusFilter}
                orderStatusOptions={orderStatusOptions}
                expandedOrders={expandedOrders}
                orderActionMessage={orderActionMessage}
                selectedOrderId={selectedOrderId}
                onOrderStatusFilterChange={setOrderStatusFilter}
                onToggleOrderExpansion={toggleOrderExpansion}
                onTrackOrder={handleTrackOrder}
                onCancelOrder={handleCancelOrder}
                onReturnReplace={handleReturnReplace}
                onWriteReview={handleWriteReview}
                isWithinReturnWindow={isWithinReturnWindow}
                orderReviews={orderReviews}
              />
            </div>
          )}

          {activeSection === "my-cart" && (
            <div ref={myCartRef}>
              <MyCartSection userCart={userCart} onCartUpdate={fetchUserCart} />
            </div>
          )}

          {activeSection === "coupons" && (
            <div ref={couponsRef}>
              <CouponsSection />
            </div>
          )}

          {activeSection === "reviews" && (
            <div ref={reviewsRef}>
              <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-6">Reviews & Ratings</h2>

                {loadingUserReviews ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">
                      Loading your reviews...
                    </p>
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No reviews yet</p>
                    <p className="text-gray-400">
                      Your product reviews will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userReviews.map((review) => (
                      <div
                        key={review._id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUserReview(review)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit review"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteUserReview(review._id!)
                              }
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete review"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mb-3">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {review.title}
                          </h4>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-2">
                              {review.images
                                .slice(0, 4)
                                .map((image: string, index: number) => (
                                  <div
                                    key={index}
                                    className="relative group cursor-pointer"
                                  >
                                    <Image
                                      src={image}
                                      alt={`Review image ${index + 1}`}
                                      width={64}
                                      height={64}
                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                      onError={(e) => {
                                        console.error(
                                          "Image failed to load:",
                                          image
                                        );
                                        e.currentTarget.style.display = "none";
                                      }}
                                      onLoad={() => {
                                        console.log(
                                          "Image loaded successfully:",
                                          image
                                        );
                                      }}
                                      onClick={() => {
                                        // Open image in new tab or implement popup
                                        window.open(image, "_blank");
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-1">
                                        <svg
                                          className="w-3 h-3 text-gray-600"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                          />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              {review.images.length > 4 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">
                                    +{review.images.length - 4}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Debug info */}
                            <div className="text-xs text-gray-400 mt-1">
                              Debug: {review.images.length} images, URLs:{" "}
                              {review.images.slice(0, 2).join(", ")}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleToggleLike(review._id!)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                              review.likes &&
                              review.likes.includes(user?._id || "")
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <svg
                              className={`w-4 h-4 ${
                                review.likes &&
                                review.likes.includes(user?._id || "")
                                  ? "fill-current"
                                  : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                            <span>{review.likesCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div ref={notificationsRef}>
              <NotificationsSection />
            </div>
          )}

          {activeSection === "gift-cards" && (
            <div ref={giftCardsRef}>
              <GiftCardsSection />
            </div>
          )}

          {activeSection === "saved-upi" && (
            <div ref={savedUpiRef}>
              <UPISection />
            </div>
          )}

          {activeSection === "saved-cards" && (
            <div ref={savedCardsRef}>
              <SavedCardsSection />
            </div>
          )}

          {activeSection === "customer-support" && (
            <div ref={customerSupportRef}>
              <CustomerSupportSection userOrders={userOrders} />
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Order
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCancelConfirm(false);
                  setSelectedOrderId("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                No
              </button>
              <button
                onClick={confirmCancelOrder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return/Replace Confirmation Modal */}
      {showReturnConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Return/Replace Request
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit a return/replace request for this
              order?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowReturnConfirm(false);
                  setSelectedOrderId("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                No
              </button>
              <button
                onClick={confirmReturnReplace}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Yes, Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Order Popup - iPhone Size */}
      {showTrackPopup && selectedOrderForTrack && (
        <div
          className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowTrackPopup(false);
            setSelectedOrderForTrack(null);
          }}
        >
          <div
            className="bg-white rounded-3xl w-80 h-[600px] mx-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iPhone-style header */}
            <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
              <div className="w-6"></div>
              <h3 className="text-md font-semibold text-gray-900">
                Track Order
              </h3>
              <button
                onClick={() => {
                  setShowTrackPopup(false);
                  setSelectedOrderForTrack(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Track content */}
            <div className="p-4 h-full overflow-y-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8 text-gray-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Order #{selectedOrderForTrack._id.slice(-8)}
                </h4>
                <p className="text-sm text-gray-600">
                  Total: ₹{selectedOrderForTrack.totalAmount}
                </p>
              </div>

              {/* Order status timeline */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Order Placed</p>
                    <p className="text-sm text-gray-600">
                      {new Date(
                        selectedOrderForTrack.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedOrderForTrack.status === "pending" && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Processing</p>
                      <p className="text-sm text-gray-600">
                        Your order is being prepared
                      </p>
                    </div>
                  </div>
                )}

                {[
                  "shipped",
                  "delivered",
                  "cancelled",
                  "returned",
                  "replaced",
                  "refunded",
                  "return/replace processing",
                ].includes(selectedOrderForTrack.status) && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Shipped</p>
                      <p className="text-sm text-gray-600">
                        Your order is on the way
                      </p>
                    </div>
                  </div>
                )}

                {selectedOrderForTrack.status === "delivered" && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Delivered</p>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          selectedOrderForTrack.updatedAt ||
                            selectedOrderForTrack.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {selectedOrderForTrack.status === "cancelled" && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">Cancelled</p>
                      <p className="text-sm text-gray-600">
                        Order has been cancelled
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping address */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">
                  Shipping Address
                </h5>
                <p className="text-sm text-gray-600">
                  {selectedOrderForTrack.shippingAddress.name}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOrderForTrack.shippingAddress.street}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOrderForTrack.shippingAddress.city},{" "}
                  {selectedOrderForTrack.shippingAddress.state} -{" "}
                  {selectedOrderForTrack.shippingAddress.zip}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedOrderForTrack.shippingAddress.country}
                </p>
                <p className="text-sm text-gray-600">
                  Phone: {selectedOrderForTrack.shippingAddress.phone}
                </p>
              </div>

              {/* Contact support */}
              <div className="mt-6 text-center mb-10">
                <p className="text-sm text-gray-600 mb-3">
                  Need help with your order?
                </p>
                <button className="bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingReview
                    ? "Edit Review"
                    : `Write a Review for ${reviewProductName}`}
                </h3>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
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
                  <label
                    htmlFor="review-title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Review Title
                  </label>
                  <input
                    id="review-title"
                    type="text"
                    value={newReview.title}
                    onChange={(e) =>
                      setNewReview({ ...newReview, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Summarize your experience"
                  />
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Review
                  </label>
                  <textarea
                    id="review-comment"
                    value={newReview.comment}
                    onChange={(e) =>
                      setNewReview({ ...newReview, comment: e.target.value })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about your experience with this product..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Review Images (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Maximum 4 images, 5MB each
                  </p>
                  <div>
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
                            <Image
                              src={image}
                              alt={`Review image ${index + 1}`}
                              width={64}
                              height={64}
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
                    onClick={handleSubmitReview}
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
    </>
  );
}
