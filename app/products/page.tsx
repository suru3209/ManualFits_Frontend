"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Product } from "../../types/types";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { Heart, ShoppingBag, Filter, Menu } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Fetching products from backend API with retry logic
async function fetchProducts(retryCount = 0): Promise<Product[]> {
  const apiUrl = buildApiUrl("/products");
  console.log("🔍 API URL:", apiUrl);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const res = await fetch(apiUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(
        `Failed to fetch products: ${res.status} ${res.statusText}`
      );
    }
    const json = await res.json();

    // Handle API response format - check for data field or direct array
    const products = json.data || (Array.isArray(json) ? json : []);
    console.log(`🔍 Found ${products.length} products`);

    // Transform products to include legacy fields for backward compatibility
    return products.map((product: Product) => ({
      ...product,
      // Map title to name for backward compatibility
      name: product.title,
      // Get first variant's price and images for display
      price: product.variants?.[0]?.price || 0,
      originalPrice: product.variants?.[0]?.originalPrice || 0,
      images: product.variants?.[0]?.images || [],
      // Get all unique colors from variants
      colors: product.variants?.map((variant) => variant.color) || [],
      // Use discountPercent as discount
      discount: product.discountPercent || 0,
      // Map reviewCount to reviews
      reviews: product.reviewCount || 0,
    }));
  } catch (error) {
    console.error("🚨 Error fetching products:", error);
    console.error("API URL attempted:", apiUrl);
    console.error("Environment:", process.env.NODE_ENV);

    // Retry logic - retry up to 3 times with exponential backoff
    if (retryCount < 3) {
      console.log(`🔄 Retrying fetch (attempt ${retryCount + 1}/3)...`);
      await new Promise((resolve) =>
        setTimeout(resolve, (retryCount + 1) * 1000)
      );
      return fetchProducts(retryCount + 1);
    }

    // If all retries failed, return empty array instead of throwing
    console.error(
      "❌ All retry attempts failed, returning empty products array"
    );
    return [];
  }
}

function ProductsPageContent() {
  const { addToCart, cartItems } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedDiscount, setSelectedDiscount] = useState<string>("");
  const [priceRange, setPriceRange] = useState<string>("");

  // Filter options
  const categories = [
    "All Categories",
    "Men",
    "Women",
    "Kids",
    "Footwear",
    "Accessories",
    "New Arrivals",
  ];

  // Get unique colors from products
  const availableColors = [
    "All Colors",
    ...Array.from(
      new Set(
        products.flatMap(
          (product) => product.variants?.map((variant) => variant.color) || []
        )
      )
    ).sort(),
  ];

  // Get unique sizes from products
  const availableSizes = [
    "All Sizes",
    ...Array.from(
      new Set(
        products.flatMap(
          (product) => product.variants?.map((variant) => variant.size) || []
        )
      )
    ).sort(),
  ];
  const discounts = [
    "All Discounts",
    "10% and above",
    "20% and above",
    "30% and above",
    "40% and above",
    "50% and above",
  ];
  const priceRanges = [
    "All Prices",
    "Under ₹500",
    "₹500 - ₹1000",
    "₹1000 - ₹2000",
    "₹2000 - ₹5000",
    "Above ₹5000",
  ];

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log("🔄 Loading products...");

        // Debug production environment
        console.log("🔍 Production Debug Info:");
        console.log("- Environment:", process.env.NODE_ENV);
        console.log("- API Base URL:", process.env.NEXT_PUBLIC_API_BASE_URL);
        console.log(
          "- Current Host:",
          typeof window !== "undefined" ? window.location.hostname : "server"
        );

        // Test both regular and admin API
        console.log("🧪 Testing regular API...");
        const regularResponse = await fetch(
          "https://manualfits-backend.onrender.com/products"
        );
        const regularData = await regularResponse.json();
        console.log("🧪 Regular API response:", regularData);

        console.log("🧪 Testing admin API...");
        const adminResponse = await fetch(
          "https://manualfits-backend.onrender.com/products?admin=true"
        );
        const adminData = await adminResponse.json();
        console.log("🧪 Admin API response:", adminData);

        const data = await fetchProducts();
        console.log(`✅ Loaded ${data.length} products`);
        setProducts(data);
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setProducts([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products based on selected filters
  const filteredProducts = products.filter((product) => {
    // Category filter
    if (
      selectedCategory &&
      selectedCategory !== "All Categories" &&
      product.category !== selectedCategory
    ) {
      return false;
    }

    // Color filter - check if any variant has the selected color
    if (selectedColor && selectedColor !== "All Colors") {
      const hasColor = product.variants?.some(
        (variant) => variant.color === selectedColor
      );
      if (!hasColor) return false;
    }

    // Size filter - check if product has the selected size
    if (
      selectedSize &&
      selectedSize !== "All Sizes" &&
      !product.variants?.some((variant) => variant.size === selectedSize)
    ) {
      return false;
    }

    // Discount filter
    if (selectedDiscount && selectedDiscount !== "All Discounts") {
      const discountValue = parseInt(selectedDiscount.split("%")[0]);

      // Calculate discount from variants like in ProductCard
      let productDiscount = 0;
      if (product.variants && product.variants.length > 0) {
        // Calculate average discount from all variants
        const discounts = product.variants
          .filter((variant) => variant.originalPrice > 0)
          .map((variant) =>
            Math.round(
              ((variant.originalPrice - variant.price) /
                variant.originalPrice) *
                100
            )
          );
        productDiscount =
          discounts.length > 0
            ? Math.round(
                discounts.reduce((sum, d) => sum + d, 0) / discounts.length
              )
            : 0;
      } else if (product.discount && product.discount > 0) {
        // Fallback to legacy discount field
        productDiscount = product.discount;
      } else if (product.discountPercent && product.discountPercent > 0) {
        // Fallback to discountPercent field
        productDiscount = product.discountPercent;
      }

      console.log(
        `Discount filter: Product "${
          product.name || product.title
        }" has ${productDiscount}% discount, filter requires ${discountValue}%+`
      );

      if (productDiscount < discountValue) {
        return false;
      }
    }

    // Price range filter - check minimum price from all variants
    if (priceRange && priceRange !== "All Prices") {
      const minPrice = Math.min(
        ...(product.variants?.map((variant) => variant.price) || [
          product.price || 0,
        ])
      );

      switch (priceRange) {
        case "Under ₹500":
          if (minPrice >= 500) return false;
          break;
        case "₹500 - ₹1000":
          if (minPrice < 500 || minPrice > 1000) return false;
          break;
        case "₹1000 - ₹2000":
          if (minPrice < 1000 || minPrice > 2000) return false;
          break;
        case "₹2000 - ₹5000":
          if (minPrice < 2000 || minPrice > 5000) return false;
          break;
        case "Above ₹5000":
          if (minPrice <= 5000) return false;
          break;
      }
    }

    return true;
  });

  const handleProductClick = (productId: number | string) => {
    window.open(`/products/${productId}`, "_blank");
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart({ ...product, qty: 1 });
  };

  const handleWishlistClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    e.preventDefault();
    const stableId = (product as unknown as { _id?: string })._id ?? product.id;
    const isWishlisted = wishlist.some(
      (p) => ((p as unknown as { _id?: string })._id ?? p.id) === stableId
    );

    console.log({
      stableId,
      isWishlisted,
      product: product.name,
    });

    if (isWishlisted) {
      removeFromWishlist(stableId!);
    } else {
      addToWishlist(product);
    }
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const stableId = (product as unknown as { _id?: string })._id ?? product.id;

    const isWishlisted = wishlist.some(
      (p) => ((p as unknown as { _id?: string })._id ?? p.id) === stableId
    );

    const addedToCart = cartItems.some(
      (item: any) => (item._id ?? item.id) === stableId
    );

    return (
      <div
        className={`bg-gray-100 relative overflow-hidden cursor-pointer transition-all duration-300 ease-out border border-gray-200 ${
          isHovered ? "rounded-lg" : "rounded-none"
        }`}
        style={{
          transform: isHovered ? "translateY(-4px)" : "translateY(0)",
          boxShadow: isHovered
            ? "0 10px 25px rgba(0, 0, 0, 0.15)"
            : "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => stableId !== undefined && handleProductClick(stableId)}
      >
        {/* Product Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-200">
          {/* Main Image */}
          <img
            src={
              product.images && product.images[0]
                ? product.images[0]
                : "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="
            }
            alt={product.name || product.title}
            className={`w-full h-full object-cover transition-all duration-500 ${
              isHovered ? "opacity-0 scale-110" : "opacity-100 scale-100"
            }`}
          />

          {/* Hover Image */}
          {product.images && product.images[1] && (
            <img
              src={product.images[1]}
              alt={product.name || product.title}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
                isHovered ? "opacity-100 scale-100" : "opacity-0 scale-110"
              }`}
            />
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => handleWishlistClick(e, product)}
            className={`absolute top-2 right-2 z-10 transition-all duration-200 ${
              isWishlisted ? "text-red-500" : "text-white/80 hover:text-red-500"
            }`}
          >
            <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {/* Discount Badge */}
          {(() => {
            // Try to get discount from new variant structure first
            let discountPercent = 0;
            if (product.variants && product.variants.length > 0) {
              // Calculate average discount from all variants
              const discounts = product.variants
                .filter((variant) => variant.originalPrice > 0)
                .map((variant) =>
                  Math.round(
                    ((variant.originalPrice - variant.price) /
                      variant.originalPrice) *
                      100
                  )
                );
              discountPercent =
                discounts.length > 0
                  ? Math.round(
                      discounts.reduce((sum, d) => sum + d, 0) /
                        discounts.length
                    )
                  : 0;
            } else if (product.discount && product.discount > 0) {
              // Fallback to legacy discount field
              discountPercent = product.discount;
            } else if (product.discountPercent && product.discountPercent > 0) {
              // Fallback to discountPercent field
              discountPercent = product.discountPercent;
            }

            return discountPercent > 0 ? (
              <div className="absolute bottom-3 right-3 w-12 h-12 bg-black/30 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-lg">
                {discountPercent}%
              </div>
            ) : null;
          })()}

          {/* Hover Overlay */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300">
              <button
                onClick={(e) => handleAddToCart(e, product)}
                className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors"
              >
                <ShoppingBag size={14} />
                {addedToCart ? "Added" : "Add to Cart"}
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-2 bg-white h-full">
          {/* Brand Name */}
          {product.brand && (
            <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
              {product.brand}
            </div>
          )}

          <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 leading-tight">
            {product.name || product.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              ₹{product.price || 0}
            </span>
            {product.originalPrice &&
              product.originalPrice > (product.price || 0) && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-0 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:mt-8">
      <div className="w-full px-0 py-8">
        {/* Filter Bar with Navigation Menu */}
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Desktop Filter Label */}
            <div className="hidden sm:flex items-center gap-2">
              <Filter size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Filters:
              </span>
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="sm:hidden flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors">
                  <Menu size={16} />
                  <span>Filters</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle className="text-[#ffffff]">
                    Filter Products
                  </SheetTitle>
                  <SheetDescription>
                    Choose your filters to find the perfect products
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Category Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Category
                    </label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Color Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Color
                    </label>
                    <Select
                      value={selectedColor}
                      onValueChange={setSelectedColor}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Color" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColors.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Size Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Size
                    </label>
                    <Select
                      value={selectedSize}
                      onValueChange={setSelectedSize}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Discount Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Discount
                    </label>
                    <Select
                      value={selectedDiscount}
                      onValueChange={(value) =>
                        setSelectedDiscount(
                          value === "All Discounts" ? "" : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Discount" />
                      </SelectTrigger>
                      <SelectContent>
                        {discounts.map((discount) => (
                          <SelectItem key={discount} value={discount}>
                            {discount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Price Range
                    </label>
                    <Select value={priceRange} onValueChange={setPriceRange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Price Range" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceRanges.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters Button */}
                  <button
                    onClick={() => {
                      setSelectedCategory("");
                      setSelectedColor("");
                      setSelectedSize("");
                      setSelectedDiscount("");
                      setPriceRange("");
                    }}
                    className="w-full mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            <NavigationMenu
              className="max-w-none hidden sm:block"
              viewport={false}
            >
              <NavigationMenuList className="flex flex-wrap gap-1">
                {/* Category Filter */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-7 text-xs px-2">
                    {selectedCategory || "Category"}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute top-full left-0 z-50 mt-1 min-w-[200px]">
                    <div className="grid gap-1 p-2 bg-white border border-gray-200 rounded-md shadow-lg">
                      {categories.map((category) => (
                        <NavigationMenuLink
                          key={category}
                          className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedCategory(category)}
                        >
                          <div className="text-sm font-medium leading-none">
                            {category}
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Color Filter */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-7 text-xs px-2">
                    {selectedColor || "Color"}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute top-full left-0 z-50 mt-1 min-w-[200px]">
                    <div className="grid gap-1 p-2 bg-white border border-gray-200 rounded-md shadow-lg">
                      {availableColors.map((color) => (
                        <NavigationMenuLink
                          key={color}
                          className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedColor(color)}
                        >
                          <div className="text-sm font-medium leading-none">
                            {color}
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Size Filter */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-7 text-xs px-2">
                    {selectedSize || "Size"}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute top-full left-0 z-50 mt-1 min-w-[200px]">
                    <div className="grid gap-1 p-2 bg-white border border-gray-200 rounded-md shadow-lg">
                      {availableSizes.map((size) => (
                        <NavigationMenuLink
                          key={size}
                          className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                          onClick={() => setSelectedSize(size)}
                        >
                          <div className="text-sm font-medium leading-none">
                            {size}
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Discount Filter */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-7 text-xs px-2">
                    {selectedDiscount || "Discount"}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute top-full left-0 z-50 mt-1 min-w-[200px]">
                    <div className="grid gap-1 p-2 bg-white border border-gray-200 rounded-md shadow-lg">
                      {discounts.map((discount) => (
                        <NavigationMenuLink
                          key={discount}
                          className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                          onClick={() =>
                            setSelectedDiscount(
                              discount === "All Discounts" ? "" : discount
                            )
                          }
                        >
                          <div className="text-sm font-medium leading-none">
                            {discount}
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Price Range Filter */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="h-7 text-xs px-2">
                    {priceRange || "Price"}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="absolute top-full left-0 z-50 mt-1 min-w-[200px]">
                    <div className="grid gap-1 p-2 bg-white border border-gray-200 rounded-md shadow-lg">
                      {priceRanges.map((range) => (
                        <NavigationMenuLink
                          key={range}
                          className="block select-none rounded-md p-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                          onClick={() => setPriceRange(range)}
                        >
                          <div className="text-sm font-medium leading-none">
                            {range}
                          </div>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Clear Filters Button */}
            <button
              onClick={() => {
                setSelectedCategory("");
                setSelectedColor("");
                setSelectedSize("");
                setSelectedDiscount("");
                setPriceRange("");
              }}
              className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 underline ml-4"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Breadcrumb Placeholder */}
        {/* <div className="mb-6 px-4">
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div> */}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            {products.length === 0 ? (
              <div>
                <p className="text-gray-500 text-lg mb-4">
                  Unable to load products. Please check your connection.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="text-gray-500 text-lg">
                No products found matching your filters.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0">
            {filteredProducts.map((product) => (
              <ProductCard
                key={(product as unknown as { _id?: string })._id ?? product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function ProductsPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-0 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="mb-6">
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-0">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="bg-gray-100 border border-gray-200 overflow-hidden"
            >
              {/* Image Skeleton */}
              <div className="aspect-[4/5] bg-gray-200 animate-pulse"></div>

              {/* Text Skeleton */}
              <div className="p-4 bg-white space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}
