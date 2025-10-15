"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import Link from "next/link";
import Image from "next/image";
import { safeLocalStorage } from "@/lib/storage";
import { buildApiUrl, API_ENDPOINTS } from "@/lib/api";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { uploadSingleImage } from "@/lib/cloudinary";
import {
  deleteReview,
  checkUserCanReview,
  fetchProductReviews,
  toggleReviewLike,
  type Review,
} from "@/lib/reviewApi";
import { useCart } from "@/context/CartContext";
import {
  User,
  CreditCard,
  Gift,
  Settings,
  ShoppingBag,
  Star,
  Bell,
  LogOut,
  MapPin,
  Smartphone,
  Ticket,
  MessageCircle,
  Home,
  Package,
  Heart,
  FileText,
  Trash,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Globe,
  Plus,
  Edit3,
  Camera,
  Edit,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrashIcon } from "@/components/ui/skiper-ui/skiper42";

interface UserData {
  _id: string;
  username: string;
  email: string;
  phone: string;
  image: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  addresses: Array<{
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
  }>;
  saved_payments?: {
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

interface Order {
  _id: string;
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  utrNumber?: string;
  shippingAddress?: any;
  items: Array<{
    product: {
      _id?: string;
      id?: string;
      name: string;
      title?: string;
      images: string[];
      variants?: Array<{
        images: string[];
      }>;
    };
    quantity: number;
    price: number;
    size?: string;
    color?: string;
  }>;
}

export default function DashboardPage() {
  const {
    wishlist,
    addToWishlist,
    removeFromWishlist: removeFromWishlistContext,
  } = useWishlist();
  const { cartItems, addToCart, increaseQty, decreaseQty, removeFromCart } =
    useCart();
  const { showToast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loadingUserReviews, setLoadingUserReviews] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);

  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [loadingActions, setLoadingActions] = useState<{
    [key: string]: boolean;
  }>({});
  const [clickedIcons, setClickedIcons] = useState<{ [key: string]: boolean }>(
    {}
  );

  // Form states
  const [editProfileForm, setEditProfileForm] = useState({
    username: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [zipCodeLoading, setZipCodeLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    type: "Home",
    is_default: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  // Payment method states
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAddUPI, setShowAddUPI] = useState(false);
  const [showEditCard, setShowEditCard] = useState(false);
  const [showEditUPI, setShowEditUPI] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingUPIId, setEditingUPIId] = useState<string | null>(null);
  const [cardForm, setCardForm] = useState({
    card_type: "credit",
    brand: "visa",
    last4: "",
    expiry_month: "",
    expiry_year: "",
    cardholder_name: "",
    is_default: false,
  });
  const [upiForm, setUpiForm] = useState({
    upi_id: "",
    name: "",
    is_default: false,
  });
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
    orderId: "",
    category: "other",
    priority: "medium",
  });

  // Order popup states
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showTracking, setShowTracking] = useState(false);

  // Support states
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportStats, setSupportStats] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  const router = useRouter();

  // Generate Invoice PDF
  const generateInvoice = (order: any) => {
    const doc = new jsPDF();

    // Company/Store header
    doc.setFontSize(20);
    doc.text("ManualFits", 20, 30);
    doc.setFontSize(12);
    doc.text("Your Perfect Fit Store", 20, 40);
    doc.text("123 Fashion Street, Mumbai, Maharashtra 400001", 20, 50);
    doc.text("Email: support@manualfits.com | Phone: +91 98765 43210", 20, 60);

    // Invoice title
    doc.setFontSize(18);
    doc.text("INVOICE", 20, 80);

    // Invoice details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${order._id.slice(-8)}`, 20, 95);
    doc.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      20,
      105
    );
    doc.text(`Order Status: ${order.status.toUpperCase()}`, 20, 115);

    // Customer details
    doc.setFontSize(12);
    doc.text("Bill To:", 120, 95);
    doc.setFontSize(10);
    if (order.shippingAddress) {
      doc.text(order.shippingAddress.name, 120, 105);
      doc.text(order.shippingAddress.street, 120, 115);
      doc.text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zip}`,
        120,
        125
      );
      doc.text(order.shippingAddress.country, 120, 135);
      doc.text(`Phone: ${order.shippingAddress.phone}`, 120, 145);
    }

    // Items table header
    doc.setFontSize(12);
    doc.text("Order Items:", 20, 165);

    let yPosition = 180;

    // Items table
    doc.setFontSize(10);
    doc.text("Item", 20, yPosition);
    doc.text("Qty", 100, yPosition);
    doc.text("Price", 130, yPosition);
    doc.text("Total", 160, yPosition);

    yPosition += 10;
    doc.line(20, yPosition - 5, 190, yPosition - 5);

    // Add each item
    order.items.forEach((item: any) => {
      doc.text(item.product.name, 20, yPosition);
      doc.text(item.quantity.toString(), 100, yPosition);
      doc.text(`₹${item.price}`, 130, yPosition);
      doc.text(`₹${item.price * item.quantity}`, 160, yPosition);
      yPosition += 10;
    });

    // Total line
    yPosition += 10;
    doc.line(20, yPosition - 5, 190, yPosition - 5);
    doc.setFontSize(12);
    doc.text("Total Amount:", 120, yPosition);
    doc.text(`₹${order.totalAmount}`, 160, yPosition);

    // Footer
    yPosition += 30;
    doc.setFontSize(8);
    doc.text("Thank you for your business!", 20, yPosition);
    doc.text(
      "For support, contact: support@manualfits.com",
      20,
      yPosition + 10
    );

    // Save the PDF
    doc.save(`invoice-${order._id.slice(-8)}.pdf`);
  };

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = safeLocalStorage.getItem("user");
      const currentToken = safeLocalStorage.getItem("token");

      if (!storedUser || !currentToken) {
        setIsLoading(false);
        window.location.href = "/account/login";
        return;
      }

      // Validate token
      try {
        const testResponse = await fetch(buildApiUrl(API_ENDPOINTS.PROFILE), {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        if (!testResponse.ok) {
          safeLocalStorage.removeItem("token");
          safeLocalStorage.removeItem("user");
          setIsLoading(false);
          window.location.href = "/account/login";
          return;
        }

        // Parse user data
        if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (error) {
            console.error("Error parsing user data:", error);
            safeLocalStorage.removeItem("user");
          }
        }

        // Fetch complete user data
        await fetchUserProfile();
        await fetchUserOrders();
        await fetchNotifications();
        await fetchCoupons();
        setIsLoading(false);
      } catch (error) {
        console.error("Token validation failed:", error);
        safeLocalStorage.removeItem("token");
        safeLocalStorage.removeItem("user");
        setIsLoading(false);
        window.location.href = "/account/login";
      }
    };

    loadUserData();
  }, []);

  // Fetch user profile
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
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    try {
      // First, load orders from localStorage for immediate display
      const savedOrders = localStorage.getItem("userOrders");
      if (savedOrders) {
        try {
          const orders = JSON.parse(savedOrders);
          setUserOrders(orders);
        } catch (parseError) {
          console.error("Error parsing saved orders:", parseError);
        }
      }

      // Then try to fetch from backend API to get latest data
      const token = safeLocalStorage.getItem("token");
      console.log(
        "Fetching user orders with token:",
        token ? "Present" : "Missing"
      );

      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_ORDERS), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const backendOrders = data.orders || [];

        // Update localStorage with backend data
        localStorage.setItem("userOrders", JSON.stringify(backendOrders));

        // Update UI with backend data
        setUserOrders(backendOrders);
      } else {
        const errorData = await response.json();
        console.error("Orders API error:", errorData);

        // If backend fails, keep localStorage orders (already loaded above)
      }
    } catch (error) {
      console.error("Error fetching orders:", error);

      // If API completely fails, keep localStorage orders (already loaded above)
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      // Mock notifications for now
      const mockNotifications = [
        {
          id: "1",
          title: "Order Delivered",
          message: "Your order #12345678 has been delivered successfully",
          type: "success",
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "New Coupon Available",
          message: "Get 20% off on your next purchase with code SAVE20",
          type: "promotion",
          read: false,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "3",
          title: "Review Request",
          message: "How was your recent purchase? Leave a review!",
          type: "review",
          read: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      // Mock coupons for now
      const mockCoupons = [
        {
          id: "1",
          code: "WELCOME20",
          discount: 20,
          type: "percentage",
          minAmount: 1000,
          maxDiscount: 500,
          validUntil: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          used: false,
        },
        {
          id: "2",
          code: "SAVE50",
          discount: 50,
          type: "fixed",
          minAmount: 2000,
          maxDiscount: 50,
          validUntil: new Date(
            Date.now() + 15 * 24 * 60 * 60 * 1000
          ).toISOString(),
          used: true,
        },
        {
          id: "3",
          code: "FIRST10",
          discount: 10,
          type: "percentage",
          minAmount: 500,
          maxDiscount: 100,
          validUntil: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          used: false,
        },
      ];
      setCoupons(mockCoupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  // Load user reviews
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
        setUserReviews(data.reviews || []);
      } else {
        // Fallback: collect reviews from orders
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
            const productId =
              (item as any).productId?._id ||
              item.product?._id ||
              item.product?.id;
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

  // Handle toggle like for user reviews
  const handleToggleLike = async (reviewId: string) => {
    try {
      const result = await toggleReviewLike(reviewId);
      if (result && typeof result === "object" && "isLiked" in result) {
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

  // Cart operations now handled by cart context

  const proceedToCheckout = () => {
    router.push("/checkout");
  };

  // Wishlist operations - using context functions

  const moveToCart = async (product: any) => {
    try {
      // Add to cart using context (this handles API call and updates context)
      addToCart({ ...product, qty: 1 });

      // Remove from wishlist using context
      await removeFromWishlistContext(product._id || product.id);

      showToast("Item moved to cart");
    } catch (error) {
      console.error("Error moving to cart:", error);
      showToast("Failed to move item to cart");
    }
  };

  // Profile operations
  const handleEditProfile = () => {
    if (user) {
      setEditProfileForm({
        username: user.username,
        email: user.email,
        phone: user.phone || "",
        dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
        gender: user.gender || "",
      });

      // Set the current profile image for preview
      const currentImage = user.image || "";

      // If user has no image, use a default placeholder
      if (!currentImage || currentImage.trim() === "") {
        // Use a default avatar image
        setProfileImagePreview(
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format"
        );
      } else {
        setProfileImagePreview(currentImage);
      }
      setProfileImage(null);
      setShowEditProfile(true);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file");
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        showToast("Image size must be less than 5MB");
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      if (!token) {
        showToast("Authentication required");
        return;
      }

      // If there's a new profile image, upload it to Cloudinary first
      let imageUrl = profileImagePreview;
      if (profileImage) {
        showToast("Uploading profile image...");

        const uploadResult = await uploadSingleImage(profileImage, token);

        if (
          uploadResult.success &&
          uploadResult.data &&
          uploadResult.data.url
        ) {
          imageUrl = uploadResult.data.url;
          showToast("Profile image uploaded successfully");
        } else {
          showToast(uploadResult.error || "Failed to upload profile image");
          return;
        }
      }

      // Update profile with new data including image (exclude email as it's not editable)
      const { email, ...profileData } = editProfileForm;
      const response = await fetch(buildApiUrl(API_ENDPOINTS.PROFILE), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...profileData,
          image: imageUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        safeLocalStorage.setItem("user", JSON.stringify(data.user));
        setShowEditProfile(false);
        setProfileImage(null);
        setProfileImagePreview("");
        showToast("Profile updated successfully");
      } else {
        showToast("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile");
    }
  };

  // Address operations
  const fetchLocationByZipCode = async (zipCode: string) => {
    if (!zipCode || zipCode.length < 6) return;

    setZipCodeLoading(true);
    try {
      // Using a free API for Indian postal codes
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${zipCode}`
      );
      const data = await response.json();

      if (
        data &&
        data[0] &&
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];
        setAddressForm((prev) => ({
          ...prev,
          city: postOffice.District || postOffice.Name || "",
          state: postOffice.State || "",
        }));
        showToast("City and state auto-filled successfully");
      } else {
        showToast("Invalid zip code or location not found");
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
      showToast("Failed to fetch location data");
    } finally {
      setZipCodeLoading(false);
    }
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const zipCode = e.target.value;

    // Only allow numbers and limit to 6 digits
    const numericZipCode = zipCode.replace(/\D/g, "").slice(0, 6);
    setAddressForm((prev) => ({ ...prev, zip: numericZipCode }));

    // Clear city and state when zip code is being changed
    if (numericZipCode.length < 6) {
      setAddressForm((prev) => ({ ...prev, city: "", state: "" }));
    }

    // Auto-fill city and state when zip code is complete
    if (numericZipCode.length === 6) {
      fetchLocationByZipCode(numericZipCode);
    }
  };

  const saveAddress = async () => {
    try {
      const token = safeLocalStorage.getItem("token");

      if (editingAddressId) {
        // Update existing address
        const response = await fetch(
          buildApiUrl(`${API_ENDPOINTS.USER_ADDRESS}/${editingAddressId}`),
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(addressForm),
          }
        );

        if (response.ok) {
          await fetchUserProfile();
          setShowEditAddress(false);
          setEditingAddressId(null);
          resetAddressForm();
          showToast("Address updated successfully");
        } else {
          showToast("Failed to update address");
        }
      } else {
        // Add new address
        const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_ADDRESS), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(addressForm),
        });

        if (response.ok) {
          await fetchUserProfile();
          setShowAddAddress(false);
          resetAddressForm();
          showToast("Address added successfully");
        } else {
          showToast("Failed to add address");
        }
      }
    } catch (error) {
      console.error("Error saving address:", error);
      showToast("Failed to save address");
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "India",
      type: "Home",
      is_default: false,
    });
  };

  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.address_id);
    setAddressForm({
      name: address.name,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
      type: address.type,
      is_default: address.is_default,
    });
    setShowEditAddress(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    setAddressToDelete(addressId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.USER_ADDRESS}/${addressToDelete}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchUserProfile();
        showToast("Address deleted successfully");
      } else {
        showToast("Failed to delete address");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      showToast("Failed to delete address");
    } finally {
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.USER_ADDRESS}/${addressId}/default`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchUserProfile();
        showToast("Default address updated successfully");
      } else {
        showToast("Failed to set default address");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      showToast("Failed to set default address");
    }
  };

  // Payment method handlers
  const handleAddCard = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl("/api/user/cards"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cardForm),
      });

      if (response.ok) {
        await fetchUserProfile();
        setShowAddCard(false);
        setCardForm({
          card_type: "credit",
          brand: "visa",
          last4: "",
          expiry_month: "",
          expiry_year: "",
          cardholder_name: "",
          is_default: false,
        });
        showToast("Card added successfully");
      } else {
        showToast("Failed to add card");
      }
    } catch (error) {
      console.error("Error adding card:", error);
      showToast("Failed to add card");
    }
  };

  const handleAddUPI = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl("/api/user/upi"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(upiForm),
      });

      if (response.ok) {
        await fetchUserProfile();
        setShowAddUPI(false);
        setUpiForm({
          upi_id: "",
          name: "",
          is_default: false,
        });
        showToast("UPI ID added successfully");
      } else {
        showToast("Failed to add UPI ID");
      }
    } catch (error) {
      console.error("Error adding UPI ID:", error);
      showToast("Failed to add UPI ID");
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(`/api/user/cards/${cardId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchUserProfile();
        showToast("Card deleted successfully");
      } else {
        showToast("Failed to delete card");
      }
    } catch (error) {
      console.error("Error deleting card:", error);
      showToast("Failed to delete card");
    }
  };

  const handleDeleteUPI = async (upiId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(`/api/user/upi/${upiId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchUserProfile();
        showToast("UPI ID deleted successfully");
      } else {
        showToast("Failed to delete UPI ID");
      }
    } catch (error) {
      console.error("Error deleting UPI ID:", error);
      showToast("Failed to delete UPI ID");
    }
  };

  const handleSetDefaultCard = async (cardId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(`/api/user/cards/${cardId}/default`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchUserProfile();
        showToast("Default card updated successfully");
      } else {
        showToast("Failed to set default card");
      }
    } catch (error) {
      console.error("Error setting default card:", error);
      showToast("Failed to set default card");
    }
  };

  const handleSetDefaultUPI = async (upiId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(`/api/user/upi/${upiId}/default`),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchUserProfile();
        showToast("Default UPI ID updated successfully");
      } else {
        showToast("Failed to set default UPI ID");
      }
    } catch (error) {
      console.error("Error setting default UPI ID:", error);
      showToast("Failed to set default UPI ID");
    }
  };

  // Support operations
  const fetchSupportTickets = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SUPPORT_TICKETS), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupportTickets(data.tickets);
      }
    } catch (error) {
      console.error("Error fetching support tickets:", error);
    }
  };

  const fetchSupportStats = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SUPPORT_STATS), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupportStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching support stats:", error);
    }
  };

  const submitSupportRequest = async () => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SUPPORT_BASE), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(supportForm),
      });

      if (response.ok) {
        setShowSupportModal(false);
        setSupportForm({
          subject: "",
          message: "",
          orderId: "",
          category: "other",
          priority: "medium",
        });
        showToast("Support request submitted successfully");
        await fetchSupportTickets();
        await fetchSupportStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Failed to submit support request");
      }
    } catch (error) {
      console.error("Error submitting support request:", error);
      showToast("Failed to submit support request");
    }
  };

  const closeSupportTicket = async (ticketId: string) => {
    try {
      const token = safeLocalStorage.getItem("token");
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.SUPPORT_CLOSE(ticketId)),
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        showToast("Support ticket closed successfully");
        await fetchSupportTickets();
        await fetchSupportStats();
        setShowTicketDetails(false);
      } else {
        const errorData = await response.json();
        showToast(errorData.message || "Failed to close support ticket");
      }
    } catch (error) {
      console.error("Error closing support ticket:", error);
      showToast("Failed to close support ticket");
    }
  };

  // Load user reviews when reviews section is active
  useEffect(() => {
    if (activeSection === "reviews") {
      loadUserReviews();
    }
  }, [activeSection]);

  // Load support data when support section is active
  useEffect(() => {
    if (activeSection === "support") {
      fetchSupportTickets();
      fetchSupportStats();
    }
  }, [activeSection]);

  const handleLogout = () => {
    safeLocalStorage.removeItem("user");
    safeLocalStorage.removeItem("token");
    safeLocalStorage.removeItem("guestCart");
    router.push("/account/login");
    window.location.reload();
  };

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show login message if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-700 text-lg">
          You must{" "}
          <Link href="/account/login" className="text-blue-600 font-semibold">
            login
          </Link>{" "}
          to view your dashboard.
        </p>
      </div>
    );
  }

  const menuItems: Array<{
    title: string;
    url: string;
    icon: any;
    isActive: boolean;
    isExternal?: boolean;
  }> = [
    {
      title: "Overview",
      url: "#overview",
      icon: Package,
      isActive: activeSection === "overview",
    },
    {
      title: "Orders",
      url: "#orders",
      icon: Package,
      isActive: activeSection === "orders",
    },
    {
      title: "Cart",
      url: "#cart",
      icon: ShoppingBag,
      isActive: activeSection === "cart",
    },
    {
      title: "Wishlist",
      url: "#wishlist",
      icon: Heart,
      isActive: activeSection === "wishlist",
    },
    {
      title: "Profile",
      url: "#profile",
      icon: User,
      isActive: activeSection === "profile",
    },
    {
      title: "Addresses",
      url: "#addresses",
      icon: MapPin,
      isActive: activeSection === "addresses",
    },
    {
      title: "Payments",
      url: "#payments",
      icon: CreditCard,
      isActive: activeSection === "payments",
    },
    {
      title: "Reviews",
      url: "#reviews",
      icon: Star,
      isActive: activeSection === "reviews",
    },
    {
      title: "Coupons",
      url: "#coupons",
      icon: Ticket,
      isActive: activeSection === "coupons",
    },
    {
      title: "Notifications",
      url: "#notifications",
      icon: Bell,
      isActive: activeSection === "notifications",
    },
    {
      title: "Support",
      url: "#support",
      icon: MessageCircle,
      isActive: activeSection === "support",
    },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden">
                {user?.image && user.image.trim() !== "" ? (
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.username}</span>
                <span className="text-xs text-gray-500">{user?.email}</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      onClick={() => (window.location.href = "/")}
                    >
                      <a href="/">
                        <Globe className="h-4 w-4" />
                        <span>Home Page</span>
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.isActive}
                        onClick={() => {
                          if (item.isExternal) {
                            window.location.href = item.url;
                          } else {
                            setActiveSection(item.url.replace("#", ""));
                          }
                        }}
                      >
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                          {item.isExternal && (
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          )}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold capitalize">
                {activeSection === "overview"
                  ? "Dashboard Overview"
                  : activeSection}
              </h1>
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4">
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <h3 className="tracking-tight text-sm font-medium">
                        Total Orders
                      </h3>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {userOrders.length}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <h3 className="tracking-tight text-sm font-medium">
                        Cart Items
                      </h3>
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {cartItems.length}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <h3 className="tracking-tight text-sm font-medium">
                        Member Since
                      </h3>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {new Date(user?.created_at || "").getFullYear()}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <h3 className="tracking-tight text-sm font-medium">
                        Addresses
                      </h3>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {user?.addresses?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                  {userOrders.length === 0 ? (
                    <p className="text-gray-500">No orders yet</p>
                  ) : (
                    <div className="space-y-3">
                      {userOrders.slice(0, 5).map((order) => (
                        <div
                          key={order._id}
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                        >
                          {/* Left side - Order info and product images */}
                          <div className="flex items-center space-x-4 flex-1">
                            {/* Product Images */}
                            <div className="flex gap-1">
                              {order.items
                                .slice(0, 2)
                                .map((item: any, index: number) => (
                                  <div
                                    key={index}
                                    className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(
                                        `/products/${
                                          item.product._id || item.product.id
                                        }`
                                      );
                                    }}
                                  >
                                    {item.product.variants &&
                                    item.product.variants.length > 0 &&
                                    item.product.variants[0].images &&
                                    item.product.variants[0].images.length >
                                      0 ? (
                                      <Image
                                        src={item.product.variants[0].images[0]}
                                        alt={item.product.title}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover rounded-md"
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 text-gray-600" />
                                    )}
                                  </div>
                                ))}
                              {order.items.length > 2 && (
                                <div className="w-10 h-10 bg-gray-200 rounded-md flex items-center justify-center">
                                  <span className="text-xs text-gray-600">
                                    +{order.items.length - 2}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Order Details */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p
                                  className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                    setShowOrderDetails(true);
                                  }}
                                >
                                  Order #{order._id.slice(-8)}
                                </p>
                                <Badge
                                  variant={
                                    order.status === "delivered"
                                      ? "default"
                                      : order.status === "pending"
                                      ? "secondary"
                                      : order.status === "cancelled"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  className="capitalize text-xs"
                                >
                                  {order.status}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>
                                  {new Date(
                                    order.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                <span>•</span>
                                <span>{order.items.length} items</span>
                                <span>•</span>
                                <span className="capitalize">
                                  {order.paymentMethod === "upi"
                                    ? "UPI"
                                    : order.paymentMethod === "card"
                                    ? "Card"
                                    : order.paymentMethod === "cod"
                                    ? "COD"
                                    : order.paymentMethod || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Total amount */}
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              ₹{order.totalAmount}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* View All Orders Link */}
                      {userOrders.length > 5 && (
                        <div className="pt-2 border-t">
                          <button
                            onClick={() => setActiveSection("orders")}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            View all orders ({userOrders.length})
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "orders" && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                {userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No orders yet</p>
                    <p className="text-gray-400">
                      Your orders will appear here
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {userOrders.map((order) => (
                      <div
                        key={order._id}
                        className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">
                              Order #{order._id.slice(-8)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(order.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              ₹{order.totalAmount}
                            </p>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : order.status === "pending"
                                  ? "secondary"
                                  : order.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3"
                            >
                              <div
                                className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/products/${
                                      item.product._id || item.product.id
                                    }`
                                  );
                                }}
                              >
                                {item.product.variants &&
                                item.product.variants.length > 0 &&
                                item.product.variants[0].images &&
                                item.product.variants[0].images.length > 0 ? (
                                  <Image
                                    src={item.product.variants[0].images[0]}
                                    alt={
                                      item.product.title || item.product.name
                                    }
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p
                                  className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/products/${
                                        item.product._id || item.product.id
                                      }`
                                    );
                                  }}
                                >
                                  {item.product.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity}
                                  {item.size && (
                                    <span className="ml-2">
                                      • Size: {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="ml-2">
                                      • Color: {item.color}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <p className="font-medium">₹{item.price}</p>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-sm text-gray-500 text-center">
                              +{order.items.length - 2} more items
                            </p>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Payment Method:</span>
                            <span className="capitalize font-medium">
                              {order.paymentMethod === "upi"
                                ? "UPI Payment"
                                : order.paymentMethod === "card"
                                ? "Card Payment"
                                : order.paymentMethod === "cod"
                                ? "Cash on Delivery"
                                : order.paymentMethod || "N/A"}
                            </span>
                          </div>
                          {order.paymentMethod === "upi" && order.utrNumber && (
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                              <span>UTR:</span>
                              <span className="font-mono">
                                {order.utrNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "cart" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Cart</h2>
                  <div className="flex gap-2">
                    {cartItems.length > 0 && (
                      <Button
                        onClick={proceedToCheckout}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Proceed to Checkout
                      </Button>
                    )}
                  </div>
                </div>

                {cartItems.length === 0 ? (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        Your cart is empty
                      </p>
                      <p className="text-gray-400">
                        Add some items to get started
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cartItems.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border bg-card text-card-foreground shadow-sm p-3 hover:shadow-md transition-shadow w-full"
                      >
                        <div className="space-y-3">
                          {/* Product Image */}
                          <div
                            className="w-full h-72 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const productId =
                                item.productId?._id ||
                                item.product?._id ||
                                item._id;
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
                              className="font-semibold text-base line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => {
                                const productId =
                                  item.productId?._id ||
                                  item.product?._id ||
                                  item._id;
                                if (productId) {
                                  router.push(`/products/${productId}`);
                                }
                              }}
                            >
                              {item.name || "Product Name"}
                            </h3>
                            <p className="text-gray-600 text-xs line-clamp-2">
                              {item.description ||
                                "Product description not available"}
                            </p>
                            <div className="flex items-center gap-1">
                              <p className="text-base font-bold text-green-600">
                                ₹{item.price || "0"}
                              </p>
                              {item.originalPrice &&
                                item.originalPrice > item.price && (
                                  <p className="text-xs text-gray-500 line-through">
                                    ₹{item.originalPrice}
                                  </p>
                                )}
                            </div>
                            {item.brand && (
                              <p className="text-xs text-blue-600 font-medium">
                                Brand: {item.brand}
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

                                  setLoadingActions((prev) => ({
                                    ...prev,
                                    [`quantity-${item._id}`]: true,
                                  }));

                                  try {
                                    await decreaseQty(productId);
                                  } catch (error) {
                                    console.error(
                                      "Error updating quantity:",
                                      error
                                    );
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
                                  loadingActions[`quantity-${item._id}`]
                                }
                                onClick={async () => {
                                  const productId = item._id;

                                  setLoadingActions((prev) => ({
                                    ...prev,
                                    [`quantity-${item._id}`]: true,
                                  }));

                                  try {
                                    await increaseQty(productId);
                                  } catch (error) {
                                    console.error(
                                      "Error updating quantity:",
                                      error
                                    );
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
                                disabled={
                                  loadingActions[`wishlist-${item._id}`]
                                }
                                onClick={async () => {
                                  const productId = item._id;

                                  setLoadingActions((prev) => ({
                                    ...prev,
                                    [`wishlist-${item._id}`]: true,
                                  }));

                                  try {
                                    // Add to wishlist using context (this handles API call and updates context)
                                    addToWishlist(item);

                                    // Remove from cart using cart context
                                    await removeFromCart(productId);

                                    showToast("Moved to wishlist");
                                  } catch (error) {
                                    console.error(
                                      "Error moving to wishlist:",
                                      error
                                    );
                                    showToast("Failed to move to wishlist");
                                  } finally {
                                    setLoadingActions((prev) => ({
                                      ...prev,
                                      [`wishlist-${item._id}`]: false,
                                    }));
                                  }
                                }}
                                className="text-xs px-2 py-1 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
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
                                  const productId =
                                    item.productId?._id || item.product?._id;
                                  setLoadingActions((prev) => ({
                                    ...prev,
                                    [`remove-${item._id}`]: true,
                                  }));

                                  try {
                                    await removeFromCart(productId);
                                  } catch (error) {
                                    console.error(
                                      "Error removing from cart:",
                                      error
                                    );
                                    showToast("Failed to remove item");
                                  } finally {
                                    setLoadingActions((prev) => ({
                                      ...prev,
                                      [`remove-${item._id}`]: false,
                                    }));
                                  }
                                }}
                                className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                                title="Remove from Cart"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Total Price */}
                          <div className="text-right">
                            <p className="font-bold text-lg text-blue-600">
                              Total: ₹{item.price * item.qty}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cart Total */}
                {cartItems.length > 0 && (
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Cart Total:</span>
                      <span>
                        ₹
                        {cartItems.reduce(
                          (total, item) => total + (item.price || 0) * item.qty,
                          0
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "profile" && (
              <div className="space-y-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Profile Information</h2>
                    <Button
                      onClick={handleEditProfile}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                        {user.image && user.image.trim() !== "" ? (
                          <Image
                            src={user.image}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <User className="w-10 h-10 text-blue-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {user.username}
                        </h3>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="block text-sm font-medium mb-1">
                          Username
                        </Label>
                        <p className="p-2 bg-muted rounded border">
                          {user.username}
                        </p>
                      </div>
                      <div>
                        <Label className="block text-sm font-medium mb-1">
                          Email
                        </Label>
                        <p className="p-2 bg-muted rounded border">
                          {user.email}
                        </p>
                      </div>
                      <div>
                        <Label className="block text-sm font-medium mb-1">
                          Phone
                        </Label>
                        <p className="p-2 bg-muted rounded border">
                          {user.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <Label className="block text-sm font-medium mb-1">
                          Gender
                        </Label>
                        <p className="p-2 bg-muted rounded border">
                          {user.gender || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                          Date of Birth
                        </Label>
                        <p className="p-2 bg-gray-50 rounded border">
                          {user.dob
                            ? new Date(user.dob).toLocaleDateString()
                            : "Not provided"}
                        </p>
                      </div>
                      <div>
                        <Label className="block text-sm font-medium text-gray-700 mb-1">
                          Member Since
                        </Label>
                        <p className="p-2 bg-gray-50 rounded border">
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edit Profile Modal */}
                <Dialog
                  open={showEditProfile}
                  onOpenChange={setShowEditProfile}
                >
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your profile information below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {/* Profile Photo Upload */}
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-border group-hover:border-primary transition-colors">
                            {profileImagePreview &&
                            profileImagePreview.trim() !== "" ? (
                              <Image
                                src={profileImagePreview}
                                alt="Profile Preview"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // If image fails to load, show default user icon
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML =
                                      '<div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"><svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                                <User className="h-8 w-8 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <input
                            type="file"
                            id="profile-image"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Label
                              htmlFor="profile-image"
                              className="cursor-pointer flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Choose Photo
                            </Label>
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            JPG, PNG up to 5MB
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={editProfileForm.username}
                          onChange={(e) =>
                            setEditProfileForm({
                              ...editProfileForm,
                              username: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                          Email
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="email"
                            type="email"
                            value={editProfileForm.email}
                            disabled
                            className="bg-muted text-muted-foreground cursor-not-allowed"
                            placeholder="Email cannot be changed"
                          />
                          <p className="text-xs text-muted-foreground">
                            Email address cannot be changed for security reasons
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={editProfileForm.phone}
                          onChange={(e) =>
                            setEditProfileForm({
                              ...editProfileForm,
                              phone: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dob" className="text-right">
                          Born
                        </Label>
                        <Input
                          id="dob"
                          type="date"
                          value={editProfileForm.dob}
                          onChange={(e) =>
                            setEditProfileForm({
                              ...editProfileForm,
                              dob: e.target.value,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gender" className="text-right">
                          Gender
                        </Label>
                        <Select
                          value={editProfileForm.gender}
                          onValueChange={(value) =>
                            setEditProfileForm({
                              ...editProfileForm,
                              gender: value,
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowEditProfile(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveProfile}>Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {activeSection === "addresses" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">My Addresses</h2>
                  <Button
                    onClick={() => setShowAddAddress(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </div>

                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  {user.addresses && user.addresses.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {user.addresses.map((address) => (
                        <div
                          key={address.address_id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{address.name}</h3>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                {address.type}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {address.is_default && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Default
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                                  onClick={() => handleEditAddress(address)}
                                  title="Edit Address"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {!address.is_default && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-yellow-600"
                                    onClick={() =>
                                      handleSetDefaultAddress(
                                        address.address_id
                                      )
                                    }
                                    title="Set as Default"
                                  >
                                    <Star className="h-4 w-4" />
                                  </Button>
                                )}
                                <AlertDialog
                                  open={
                                    deleteDialogOpen &&
                                    addressToDelete === address.address_id
                                  }
                                  onOpenChange={setDeleteDialogOpen}
                                >
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                      onClick={() =>
                                        handleDeleteAddress(address.address_id)
                                      }
                                      title="Delete Address"
                                    >
                                      <TrashIcon />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Address
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this
                                        address? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeleteAddress}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{address.street}</p>
                            <p>
                              {address.city}, {address.state} - {address.zip}
                            </p>
                            <p>{address.country}</p>
                            <p>Phone: {address.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">
                        No addresses saved
                      </p>
                      <p className="text-gray-400">
                        Add an address for faster checkout
                      </p>
                    </div>
                  )}
                </div>

                {/* Add Address Modal */}
                <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Address</DialogTitle>
                      <DialogDescription>
                        Add a new address for faster checkout.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={addressForm.name}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              name: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Full name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              phone: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="street" className="text-right">
                          Street
                        </Label>
                        <Textarea
                          id="street"
                          value={addressForm.street}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              street: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="city" className="text-right">
                          City
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                city: e.target.value,
                              })
                            }
                            className="bg-muted/50"
                            placeholder="City"
                          />
                          {addressForm.city && (
                            <p className="text-xs text-green-600">
                              ✓ Auto-filled from ZIP code
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="state" className="text-right">
                          State
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="state"
                            value={addressForm.state}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                state: e.target.value,
                              })
                            }
                            className="bg-muted/50"
                            placeholder="State"
                          />
                          {addressForm.state && (
                            <p className="text-xs text-green-600">
                              ✓ Auto-filled from ZIP code
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="zip" className="text-right">
                          ZIP Code
                        </Label>
                        <div className="col-span-3 relative">
                          <Input
                            id="zip"
                            value={addressForm.zip}
                            onChange={handleZipCodeChange}
                            className="pr-20"
                            placeholder="Enter 6-digit ZIP code"
                            maxLength={6}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            {zipCodeLoading && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            )}
                            {addressForm.zip.length > 0 && !zipCodeLoading && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setAddressForm((prev) => ({
                                    ...prev,
                                    zip: "",
                                    city: "",
                                    state: "",
                                  }));
                                }}
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter 6-digit ZIP code to auto-fill city and state
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">
                          Type
                        </Label>
                        <Select
                          value={addressForm.type}
                          onValueChange={(value) =>
                            setAddressForm({ ...addressForm, type: value })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddAddress(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveAddress}>Add Address</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Address Modal */}
                <Dialog
                  open={showEditAddress}
                  onOpenChange={setShowEditAddress}
                >
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Edit Address</DialogTitle>
                      <DialogDescription>
                        Update your address information.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="edit-name"
                          value={addressForm.name}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              name: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Full name"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-phone" className="text-right">
                          Phone
                        </Label>
                        <Input
                          id="edit-phone"
                          value={addressForm.phone}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              phone: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-street" className="text-right">
                          Street
                        </Label>
                        <Input
                          id="edit-street"
                          value={addressForm.street}
                          onChange={(e) =>
                            setAddressForm({
                              ...addressForm,
                              street: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-city" className="text-right">
                          City
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="edit-city"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                city: e.target.value,
                              })
                            }
                            className="bg-muted/50"
                            placeholder="City"
                          />
                          {addressForm.city && (
                            <p className="text-xs text-green-600">
                              ✓ Auto-filled from ZIP code
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-state" className="text-right">
                          State
                        </Label>
                        <div className="col-span-3 space-y-1">
                          <Input
                            id="edit-state"
                            value={addressForm.state}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                state: e.target.value,
                              })
                            }
                            className="bg-muted/50"
                            placeholder="State"
                          />
                          {addressForm.state && (
                            <p className="text-xs text-green-600">
                              ✓ Auto-filled from ZIP code
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-zip" className="text-right">
                          ZIP Code
                        </Label>
                        <div className="col-span-3 relative">
                          <Input
                            id="edit-zip"
                            value={addressForm.zip}
                            onChange={handleZipCodeChange}
                            className="pr-20"
                            placeholder="Enter 6-digit ZIP code"
                            maxLength={6}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                            {zipCodeLoading && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            )}
                            {addressForm.zip.length > 0 && !zipCodeLoading && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setAddressForm((prev) => ({
                                    ...prev,
                                    zip: "",
                                    city: "",
                                    state: "",
                                  }));
                                }}
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter 6-digit ZIP code to auto-fill city and state
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-type" className="text-right">
                          Type
                        </Label>
                        <Select
                          value={addressForm.type}
                          onValueChange={(value) =>
                            setAddressForm({
                              ...addressForm,
                              type: value,
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select address type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowEditAddress(false);
                          setEditingAddressId(null);
                          resetAddressForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={saveAddress}>Update Address</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {activeSection === "wishlist" && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">My Wishlist</h2>
                {wishlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      Your wishlist is empty
                    </p>
                    <p className="text-gray-400">
                      Add items to your wishlist to save them for later
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((item: any) => (
                      <div
                        key={item._id || item.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div
                          className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4 cursor-pointer hover:opacity-90 transition-opacity"
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
                            <Package className="h-16 w-16 text-gray-600" />
                          )}
                        </div>
                        <h3
                          className="font-semibold text-lg mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => {
                            const productId = item._id || item.id;
                            if (productId) {
                              router.push(`/products/${productId}`);
                            }
                          }}
                        >
                          {item.name}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-lg">₹{item.price}</p>
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
                                removeFromWishlistContext(itemId);
                                showToast("Item removed from wishlist");
                                // Reset after animation
                                setTimeout(() => {
                                  setClickedIcons((prev) => ({
                                    ...prev,
                                    [`remove-${itemId}`]: false,
                                  }));
                                }, 300);
                              }}
                              className="text-red-500 hover:bg-red-50 hover:text-red-600 p-2 transition-all duration-200"
                              title="Remove from Wishlist"
                            >
                              <Heart
                                className={`h-4 w-4 transition-all duration-200 ${
                                  clickedIcons[`remove-${item._id || item.id}`]
                                    ? "fill-red-500 scale-110"
                                    : "fill-red-500 hover:fill-red-600"
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
                              className="bg-blue-600 hover:bg-blue-700 p-2 transition-all duration-200"
                              title="Move to Cart"
                            >
                              <ShoppingBag
                                className={`h-4 w-4 transition-all duration-200 ${
                                  clickedIcons[`cart-${item._id || item.id}`]
                                    ? "fill-white scale-110"
                                    : "hover:fill-white"
                                }`}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "payments" && (
              <div className="space-y-6">
                {/* Saved Cards */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-6">
                    Saved Payment Methods
                  </h2>

                  {/* Credit/Debit Cards */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <CreditCard className="h-5 w-5 mr-2" />
                        Credit/Debit Cards
                      </h3>
                      <Button
                        onClick={() => setShowAddCard(true)}
                        variant="outline"
                        size="sm"
                        disabled
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Card (Coming Soon)
                      </Button>
                    </div>
                    {user?.saved_payments?.cards &&
                    user.saved_payments.cards.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-3">
                        {user.saved_payments.cards.map((card: any) => (
                          <div
                            key={card.card_id}
                            className="border rounded-lg p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white relative"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <CreditCard className="h-6 w-6 mr-2" />
                                <span className="font-semibold">
                                  {card.brand.toUpperCase()}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {card.is_default && (
                                  <span className="bg-white text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                                    Default
                                  </span>
                                )}
                                <div className="flex gap-1">
                                  {!card.is_default && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-white hover:text-yellow-300"
                                      onClick={() =>
                                        handleSetDefaultCard(card.card_id)
                                      }
                                      title="Set as Default"
                                    >
                                      <Star className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-white hover:text-blue-300"
                                    onClick={() => {
                                      setEditingCardId(card.card_id);
                                      setCardForm({
                                        card_type: card.card_type || "credit",
                                        brand: card.brand || "visa",
                                        last4: card.last4,
                                        expiry_month: card.expiry_month,
                                        expiry_year: card.expiry_year,
                                        cardholder_name: card.cardholder_name,
                                        is_default: card.is_default,
                                      });
                                      setShowEditCard(true);
                                    }}
                                    title="Edit Card"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-white hover:text-red-300"
                                    onClick={() =>
                                      handleDeleteCard(card.card_id)
                                    }
                                    title="Delete Card"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-lg font-bold">
                                **** **** **** {card.last4}
                              </p>
                              <p className="text-sm opacity-90">
                                {card.cardholder_name}
                              </p>
                              <p className="text-sm opacity-90">
                                Expires {card.expiry_month}/{card.expiry_year}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No saved cards</p>
                        <p className="text-gray-400">
                          Add a card for faster checkout
                        </p>
                      </div>
                    )}
                  </div>

                  {/* UPI IDs */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Smartphone className="h-5 w-5 mr-2" />
                        UPI IDs
                      </h3>
                      <Button
                        onClick={() => setShowAddUPI(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add UPI ID
                      </Button>
                    </div>
                    {user?.saved_payments?.upi &&
                    user.saved_payments.upi.length > 0 ? (
                      <div className="space-y-3">
                        {user.saved_payments?.upi?.map((upi: any) => (
                          <div
                            key={upi.upi_id}
                            className="border rounded-lg p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <Smartphone className="h-5 w-5 mr-3 text-gray-600" />
                              <div>
                                <p className="font-medium">{upi.upi_id}</p>
                                <p className="text-sm text-gray-500">
                                  {upi.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {upi.is_default && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                  Default
                                </span>
                              )}
                              {!upi.is_default && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-yellow-600"
                                  onClick={() =>
                                    handleSetDefaultUPI(upi.upi_id)
                                  }
                                  title="Set as Default"
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600"
                                onClick={() => {
                                  setEditingUPIId(upi.upi_id);
                                  setUpiForm({
                                    upi_id: upi.upi_id,
                                    name: upi.name,
                                    is_default: upi.is_default,
                                  });
                                  setShowEditUPI(true);
                                }}
                                title="Edit UPI ID"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                onClick={() => handleDeleteUPI(upi.upi_id)}
                                title="Delete UPI ID"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                          No saved UPI IDs
                        </p>
                        <p className="text-gray-400">
                          Add UPI for quick payments
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Gift Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <Gift className="h-5 w-5 mr-2" />
                        Gift Cards
                      </h3>
                      <Button
                        disabled
                        variant="outline"
                        size="sm"
                        className="opacity-50 cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Gift Card
                      </Button>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                        <p className="text-yellow-800 font-medium">
                          Coming Soon!
                        </p>
                      </div>
                      <p className="text-yellow-700 text-sm mt-1">
                        Gift card management feature is under development.
                      </p>
                    </div>
                    {user?.saved_payments?.gift_cards &&
                    user.saved_payments.gift_cards.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {user.saved_payments.gift_cards.map((giftCard: any) => (
                          <div
                            key={giftCard.giftcard_id}
                            className="border rounded-lg p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <Gift className="h-6 w-6" />
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  giftCard.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {giftCard.is_active ? "Active" : "Expired"}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <p className="text-lg font-bold">
                                ₹{giftCard.balance}
                              </p>
                              <p className="text-sm opacity-90">
                                Code: {giftCard.code}
                              </p>
                              <p className="text-sm opacity-90">
                                Expires:{" "}
                                {new Date(
                                  giftCard.expiry_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Gift className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No gift cards</p>
                        <p className="text-gray-400">
                          Gift cards will appear here when added
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "reviews" && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">
                  My Reviews & Ratings
                </h2>

                {loadingUserReviews ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">
                      Loading your reviews...
                    </p>
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
                        className="border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${
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

                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                            {review.title}
                          </h4>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="mb-4">
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
                                      width={80}
                                      height={80}
                                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                    />
                                  </div>
                                ))}
                              {review.images.length > 4 && (
                                <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">
                                    +{review.images.length - 4}
                                  </span>
                                </div>
                              )}
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
            )}

            {activeSection === "coupons" && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">My Coupons</h2>
                {coupons.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">
                      No coupons available
                    </p>
                    <p className="text-gray-400">
                      Check back later for new offers
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className={`border rounded-lg p-6 relative overflow-hidden ${
                          coupon.used
                            ? "bg-gray-50 opacity-75"
                            : "bg-gradient-to-br from-orange-50 to-red-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Ticket
                              className={`h-6 w-6 mr-2 ${
                                coupon.used
                                  ? "text-gray-400"
                                  : "text-orange-500"
                              }`}
                            />
                            <span
                              className={`font-bold text-lg ${
                                coupon.used
                                  ? "text-gray-500"
                                  : "text-orange-600"
                              }`}
                            >
                              {coupon.code}
                            </span>
                          </div>
                          {coupon.used && (
                            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                              Used
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-2xl font-bold text-gray-900">
                            {coupon.type === "percentage"
                              ? `${coupon.discount}%`
                              : `₹${coupon.discount}`}{" "}
                            OFF
                          </p>
                          <p className="text-sm text-gray-600">
                            Min. purchase: ₹{coupon.minAmount}
                          </p>
                          {coupon.type === "percentage" &&
                            coupon.maxDiscount && (
                              <p className="text-sm text-gray-600">
                                Max. discount: ₹{coupon.maxDiscount}
                              </p>
                            )}
                        </div>

                        <div className="text-sm text-gray-500 mb-4">
                          <p>
                            Valid until:{" "}
                            {new Date(coupon.validUntil).toLocaleDateString()}
                          </p>
                        </div>

                        {!coupon.used && (
                          <button className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                            Use Coupon
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="text-2xl font-bold mb-6">Notifications</h2>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No notifications</p>
                    <p className="text-gray-400">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-4 ${
                          !notification.read
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              notification.type === "success"
                                ? "bg-green-100 text-green-600"
                                : notification.type === "promotion"
                                ? "bg-orange-100 text-orange-600"
                                : notification.type === "review"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {notification.type === "success" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : notification.type === "promotion" ? (
                              <Gift className="h-5 w-5" />
                            ) : notification.type === "review" ? (
                              <Star className="h-5 w-5" />
                            ) : (
                              <Bell className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {notification.title}
                              </h3>
                              <span className="text-sm text-gray-500">
                                {new Date(
                                  notification.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-600">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "support" && (
              <div className="space-y-6">
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                  <h2 className="text-2xl font-bold mb-6">Customer Support</h2>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Contact Options */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Get in Touch
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                            <Phone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Phone Support</p>
                            <p className="text-sm text-gray-600">
                              +91 9876543210
                            </p>
                            <p className="text-xs text-gray-500">
                              Mon-Fri, 9 AM - 6 PM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="p-2 bg-green-100 text-green-600 rounded-full">
                            <Mail className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Email Support</p>
                            <p className="text-sm text-gray-600">
                              support@manualfits.com
                            </p>
                            <p className="text-xs text-gray-500">
                              24/7 Support
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => (window.location.href = "/support")}
                        >
                          <div className="p-2 bg-purple-100 text-purple-600 rounded-full">
                            <MessageCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">Live Chat</p>
                            <p className="text-sm text-gray-600">
                              Available now
                            </p>
                            <p className="text-xs text-gray-500">
                              Average response: 2 min
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setSupportForm({
                              ...supportForm,
                              subject: "Order Tracking",
                            });
                            setShowSupportModal(true);
                          }}
                        >
                          <Package className="h-5 w-5 mr-3 text-gray-600" />
                          Track Order
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setSupportForm({
                              ...supportForm,
                              subject: "Return/Exchange Request",
                            });
                            setShowSupportModal(true);
                          }}
                        >
                          <ExternalLink className="h-5 w-5 mr-3 text-gray-600" />
                          Return/Exchange
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => window.open("/faq", "_blank")}
                        >
                          <FileText className="h-5 w-5 mr-3 text-gray-600" />
                          FAQ
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setSupportForm({
                              ...supportForm,
                              subject: "Report Issue",
                            });
                            setShowSupportModal(true);
                          }}
                        >
                          <AlertCircle className="h-5 w-5 mr-3 text-gray-600" />
                          Report Issue
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders for Support Context */}
                  {userOrders.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">
                        Recent Orders (for support reference)
                      </h3>
                      <div className="space-y-2">
                        {userOrders.slice(0, 3).map((order) => (
                          <div
                            key={order._id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                Order #{order._id.slice(-8)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}{" "}
                                • ₹{order.totalAmount}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs capitalize ${
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-800"
                                  : order.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Support Modal */}
                <Dialog
                  open={showSupportModal}
                  onOpenChange={setShowSupportModal}
                >
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Contact Support</DialogTitle>
                      <DialogDescription>
                        Describe your issue and we'll get back to you soon.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="subject" className="text-right">
                          Subject
                        </Label>
                        <Input
                          id="subject"
                          value={supportForm.subject}
                          onChange={(e) =>
                            setSupportForm({
                              ...supportForm,
                              subject: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="orderId" className="text-right">
                          Order ID
                        </Label>
                        <Select
                          value={supportForm.orderId}
                          onValueChange={(value) =>
                            setSupportForm({ ...supportForm, orderId: value })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select order (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {userOrders.map((order) => (
                              <SelectItem key={order._id} value={order._id}>
                                Order #{order._id.slice(-8)} - ₹
                                {order.totalAmount}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="message" className="text-right">
                          Message
                        </Label>
                        <Textarea
                          id="message"
                          value={supportForm.message}
                          onChange={(e) =>
                            setSupportForm({
                              ...supportForm,
                              message: e.target.value,
                            })
                          }
                          className="col-span-3"
                          placeholder="Describe your issue in detail..."
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowSupportModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={submitSupportRequest}>
                        Submit Request
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </SidebarInset>
      </div>

      {/* Add Card Modal */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Card</DialogTitle>
            <DialogDescription>
              Add a new credit or debit card for faster checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="last4">Last 4 Digits</Label>
              <Input
                id="last4"
                placeholder="1234"
                maxLength={4}
                value={cardForm.last4}
                autoComplete="cc-number"
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                  if (value.length <= 4) {
                    setCardForm({ ...cardForm, last4: value });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry_month">Expiry Month</Label>
                <Input
                  id="expiry_month"
                  placeholder="MM"
                  maxLength={2}
                  value={cardForm.expiry_month}
                  autoComplete="cc-exp-month"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                    if (value.length <= 2) {
                      // Validate month: 01-12
                      if (
                        value === "" ||
                        (parseInt(value) >= 1 && parseInt(value) <= 12)
                      ) {
                        setCardForm({ ...cardForm, expiry_month: value });
                      }
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="expiry_year">Expiry Year</Label>
                <Input
                  id="expiry_year"
                  placeholder="YYYY"
                  maxLength={4}
                  value={cardForm.expiry_year}
                  autoComplete="cc-exp-year"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                    if (value.length <= 4) {
                      setCardForm({ ...cardForm, expiry_year: value });
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cardholder_name">Cardholder Name</Label>
              <Input
                id="cardholder_name"
                placeholder="John Doe"
                value={cardForm.cardholder_name}
                autoComplete="cc-name"
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow letters and spaces (no numbers)
                  if (/^[a-zA-Z\s]*$/.test(value)) {
                    setCardForm({
                      ...cardForm,
                      cardholder_name: value,
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="card_type">Card Type</Label>
                <select
                  id="card_type"
                  value={cardForm.card_type}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, card_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <Label htmlFor="brand">Brand</Label>
                <select
                  id="brand"
                  value={cardForm.brand}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, brand: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="discover">Discover</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_default_card"
                checked={cardForm.is_default}
                onChange={(e) =>
                  setCardForm({ ...cardForm, is_default: e.target.checked })
                }
              />
              <Label htmlFor="is_default_card">Set as default card</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCard(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCard}>Add Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add UPI Modal */}
      <Dialog open={showAddUPI} onOpenChange={setShowAddUPI}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add UPI ID</DialogTitle>
            <DialogDescription>
              Add a new UPI ID for quick payments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                placeholder="yourname@paytm"
                value={upiForm.upi_id}
                onChange={(e) =>
                  setUpiForm({ ...upiForm, upi_id: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="upi_name">Display Name</Label>
              <Input
                id="upi_name"
                placeholder="Your Name"
                value={upiForm.name}
                onChange={(e) =>
                  setUpiForm({ ...upiForm, name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_default_upi"
                checked={upiForm.is_default}
                onChange={(e) =>
                  setUpiForm({ ...upiForm, is_default: e.target.checked })
                }
              />
              <Label htmlFor="is_default_upi">Set as default UPI ID</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUPI(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUPI}>Add UPI ID</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Modal */}
      <Dialog open={showEditCard} onOpenChange={setShowEditCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>Update your card information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_last4">Last 4 Digits</Label>
              <Input
                id="edit_last4"
                placeholder="1234"
                maxLength={4}
                value={cardForm.last4}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                  if (value.length <= 4) {
                    setCardForm({ ...cardForm, last4: value });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_expiry_month">Expiry Month</Label>
                <Input
                  id="edit_expiry_month"
                  placeholder="MM"
                  maxLength={2}
                  value={cardForm.expiry_month}
                  autoComplete="cc-exp-month"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                    if (value.length <= 2) {
                      // Validate month: 01-12
                      if (
                        value === "" ||
                        (parseInt(value) >= 1 && parseInt(value) <= 12)
                      ) {
                        setCardForm({ ...cardForm, expiry_month: value });
                      }
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit_expiry_year">Expiry Year</Label>
                <Input
                  id="edit_expiry_year"
                  placeholder="YYYY"
                  maxLength={4}
                  value={cardForm.expiry_year}
                  autoComplete="cc-exp-year"
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                    if (value.length <= 4) {
                      setCardForm({ ...cardForm, expiry_year: value });
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit_cardholder_name">Cardholder Name</Label>
              <Input
                id="edit_cardholder_name"
                placeholder="John Doe"
                value={cardForm.cardholder_name}
                autoComplete="cc-name"
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow letters and spaces (no numbers)
                  if (/^[a-zA-Z\s]*$/.test(value)) {
                    setCardForm({
                      ...cardForm,
                      cardholder_name: value,
                    });
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_card_type">Card Type</Label>
                <select
                  id="edit_card_type"
                  value={cardForm.card_type}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, card_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit_brand">Brand</Label>
                <select
                  id="edit_brand"
                  value={cardForm.brand}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, brand: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="visa">Visa</option>
                  <option value="mastercard">Mastercard</option>
                  <option value="amex">American Express</option>
                  <option value="discover">Discover</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_default_card"
                checked={cardForm.is_default}
                onChange={(e) =>
                  setCardForm({ ...cardForm, is_default: e.target.checked })
                }
              />
              <Label htmlFor="edit_is_default_card">Set as default card</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCard(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Handle edit card logic here
                setShowEditCard(false);
                showToast("Card updated successfully");
              }}
            >
              Update Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit UPI Modal */}
      <Dialog open={showEditUPI} onOpenChange={setShowEditUPI}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit UPI ID</DialogTitle>
            <DialogDescription>
              Update your UPI ID information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_upi_id">UPI ID</Label>
              <Input
                id="edit_upi_id"
                placeholder="yourname@paytm"
                value={upiForm.upi_id}
                onChange={(e) =>
                  setUpiForm({ ...upiForm, upi_id: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit_upi_name">Display Name</Label>
              <Input
                id="edit_upi_name"
                placeholder="Your Name"
                value={upiForm.name}
                onChange={(e) =>
                  setUpiForm({ ...upiForm, name: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_default_upi"
                checked={upiForm.is_default}
                onChange={(e) =>
                  setUpiForm({ ...upiForm, is_default: e.target.checked })
                }
              />
              <Label htmlFor="edit_is_default_upi">Set as default UPI ID</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUPI(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Handle edit UPI logic here
                setShowEditUPI(false);
                showToast("UPI ID updated successfully");
              }}
            >
              Update UPI ID
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Popup */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?._id?.slice(-8)} - {selectedOrder?.status}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Order Date
                  </Label>
                  <p>
                    {new Date(selectedOrder.createdAt).toLocaleDateString()} at{" "}
                    {new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Payment Method
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium">
                      {selectedOrder.paymentMethod === "upi"
                        ? "UPI Payment"
                        : selectedOrder.paymentMethod === "card"
                        ? "Card Payment"
                        : selectedOrder.paymentMethod === "cod"
                        ? "Cash on Delivery"
                        : selectedOrder.paymentMethod || "N/A"}
                    </span>
                    {selectedOrder.paymentMethod === "upi" &&
                      selectedOrder.utrNumber && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          UTR: {selectedOrder.utrNumber}
                        </span>
                      )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Total Amount
                  </Label>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg">
                      ₹{selectedOrder.totalAmount}
                    </p>
                    {(selectedOrder.status === "delivered" ||
                      selectedOrder.status === "confirmed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateInvoice(selectedOrder)}
                        className="text-xs"
                      >
                        📄 Generate Invoice
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Shipping Address
                </Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  {selectedOrder.shippingAddress ? (
                    <div className="space-y-1">
                      <p className="font-medium">
                        {selectedOrder.shippingAddress.name}
                      </p>
                      <p className="text-sm">
                        {selectedOrder.shippingAddress.street}
                      </p>
                      <p className="text-sm">
                        {selectedOrder.shippingAddress.city},{" "}
                        {selectedOrder.shippingAddress.state} -{" "}
                        {selectedOrder.shippingAddress.zip}
                      </p>
                      <p className="text-sm">
                        {selectedOrder.shippingAddress.country}
                      </p>
                      <p className="text-sm">
                        Phone: {selectedOrder.shippingAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No shipping address available
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Query Message - Only show for cancelled/returned orders */}
              {(selectedOrder.status === "cancelled" ||
                selectedOrder.status === "returned" ||
                selectedOrder.status === "replaced") && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Admin Message
                  </Label>
                  <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-gray-700">
                      {selectedOrder.adminMessage ||
                        "No admin message available for this order."}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Order Items
                </Label>
                <div className="space-y-3 mt-2">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div
                        className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          router.push(
                            `/products/${item.product._id || item.product.id}`
                          );
                        }}
                      >
                        {item.product.variants &&
                        item.product.variants.length > 0 &&
                        item.product.variants[0].images &&
                        item.product.variants[0].images.length > 0 ? (
                          <Image
                            src={item.product.variants[0].images[0]}
                            alt={item.product.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => {
                            router.push(
                              `/products/${item.product._id || item.product.id}`
                            );
                          }}
                        >
                          {item.product.title}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          <span>Qty: {item.quantity}</span>
                          {item.size && (
                            <span>
                              Size:{" "}
                              <span className="font-medium">{item.size}</span>
                            </span>
                          )}
                          {item.color && (
                            <span>
                              Color:{" "}
                              <span className="font-medium">{item.color}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-medium">₹{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setShowTracking(true);
                    setShowOrderDetails(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Track Order
                </Button>

                {selectedOrder &&
                  selectedOrder.status !== "delivered" &&
                  selectedOrder.status !== "cancelled" && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        try {
                          // Show loading state
                          setLoadingActions((prev) => ({
                            ...prev,
                            cancelOrder: true,
                          }));

                          const token = safeLocalStorage.getItem("token");
                          if (!token) {
                            showToast("Authentication required");
                            return;
                          }

                          // Call backend API to cancel order
                          const response = await fetch(
                            buildApiUrl(
                              API_ENDPOINTS.ORDER_CANCEL(selectedOrder._id)
                            ),
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );

                          if (response.ok) {
                            const responseData = await response.json();
                            showToast("Order cancelled successfully");

                            // Update the selected order status immediately
                            setSelectedOrder((prev: Order | null) =>
                              prev
                                ? {
                                    ...prev,
                                    status: "cancelled",
                                  }
                                : null
                            );

                            // Refresh orders to update the list
                            await fetchUserOrders();
                            setShowOrderDetails(false);
                          } else {
                            const errorData = await response.json();
                            let errorMessage = "Failed to cancel order";

                            // Handle specific error cases
                            if (response.status === 404) {
                              errorMessage = "Order not found";
                            } else if (response.status === 403) {
                              errorMessage = "Access denied";
                            } else if (response.status === 400) {
                              // Check if order is already cancelled
                              if (
                                errorData.message &&
                                errorData.message.includes(
                                  "Current status: cancelled"
                                )
                              ) {
                                errorMessage =
                                  "This order has already been cancelled";
                                // Refresh orders to update the UI
                                await fetchUserOrders();
                              } else {
                                errorMessage =
                                  errorData.message ||
                                  "Order cannot be cancelled";
                              }
                            } else if (response.status === 500) {
                              errorMessage =
                                "Server error. Please try again later.";
                            }

                            showToast(errorMessage);
                          }
                        } catch (error) {
                          console.error("Error cancelling order:", error);
                          showToast(
                            "Failed to cancel order. Please try again."
                          );
                        } finally {
                          // Hide loading state
                          setLoadingActions((prev) => ({
                            ...prev,
                            cancelOrder: false,
                          }));
                        }
                      }}
                      disabled={loadingActions.cancelOrder}
                    >
                      {loadingActions.cancelOrder
                        ? "Cancelling..."
                        : "Cancel Order"}
                    </Button>
                  )}

                {selectedOrder.status === "delivered" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Handle return/replace
                      showToast("Return/Replace request submitted");
                      setShowOrderDetails(false);
                    }}
                  >
                    Return/Replace
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOrderDetails(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tracking Popup */}
      <Dialog open={showTracking} onOpenChange={setShowTracking}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Tracking</DialogTitle>
            <DialogDescription>
              Track your order #{selectedOrder?._id?.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Tracking Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Order Status</span>
                  <Badge
                    variant={
                      selectedOrder.status === "delivered"
                        ? "default"
                        : selectedOrder.status === "pending"
                        ? "secondary"
                        : selectedOrder.status === "cancelled"
                        ? "destructive"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Order Placed</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {selectedOrder.status === "shipped" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Shipped</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        In Transit
                      </span>
                    </div>
                  )}

                  {selectedOrder.status === "delivered" && (
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Delivered</span>
                      <span className="text-xs text-gray-500 ml-auto">
                        Completed
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Support */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Contact our customer support for any queries about your order.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTracking(false);
                    setShowSupportModal(true);
                  }}
                  className="w-full"
                >
                  Contact Customer Support
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTracking(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
