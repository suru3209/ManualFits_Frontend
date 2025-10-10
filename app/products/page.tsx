"use client";
import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { Product } from "../../types/types";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { Filter, X, SlidersHorizontal, Heart, ShoppingBag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import DynamicBreadcrumb from "@/lib/breadcrumb";
import { buildApiUrl } from "@/lib/api";

// Fetching products from backend API
async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(buildApiUrl("/products"), { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }
  const json = await res.json();
  // Backend returns { message, count, data }
  return Array.isArray(json) ? json : json.data ?? [];
}

function ProductsPageContent() {
  const { addToCart, cartItems } = useCart();
  // const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);

  // Get URL parameters
  const categoryParam = searchParams.get("category");
  const subcategoryParam = searchParams.get("subcategory");
  const searchParam = searchParams.get("search");

  // Filters state
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);

  // Filter options
  const categories = [
    "Men",
    "Women",
    "Kids",
    "Footwear",
    "Accessories",
    "New Arrivals",
  ];
  const colors = ["White", "Black", "Gray", "Red", "Green", "Yellow", "Pink"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const discounts = [10, 20, 30, 40, 50, 60, 70];

  // Fetch products on mount
  useEffect(() => {
    fetchProducts()
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  }, []);

  // Auto-apply URL parameters as filters
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    if (subcategoryParam) {
      // You can add subcategory filtering logic here
      console.log("Subcategory filter:", subcategoryParam);
    }
    if (searchParam) {
      // You can add search filtering logic here
      console.log("Search filter:", searchParam);
    }
  }, [categoryParam, subcategoryParam, searchParam]);

  // Enhanced filtering with subcategory support
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Price range filter
      if (product.price < priceRange[0] || product.price > priceRange[1])
        return false;

      // Category filter
      if (
        selectedCategories.length &&
        !selectedCategories.includes(product.category)
      )
        return false;

      // Subcategory filter (if URL parameter exists)
      if (subcategoryParam && product.category === categoryParam) {
        // You can add more specific subcategory logic here
        // For now, we'll filter by product name containing subcategory
        if (
          !product.name.toLowerCase().includes(subcategoryParam.toLowerCase())
        ) {
          return false;
        }
      }

      // Search filter
      if (
        searchParam &&
        !product.name.toLowerCase().includes(searchParam.toLowerCase())
      ) {
        return false;
      }

      // Color filter
      if (
        selectedColors.length &&
        !product.colors.some((c) => selectedColors.includes(c))
      )
        return false;

      // Size filter
      if (
        selectedSizes.length &&
        !product.sizes.some((s) => selectedSizes.includes(s.size))
      )
        return false;

      // Discount filter
      if (
        selectedDiscounts.length &&
        !selectedDiscounts.some((d) => product.discount >= d)
      )
        return false;

      return true;
    });
  }, [
    products,
    priceRange,
    selectedCategories,
    selectedColors,
    selectedSizes,
    selectedDiscounts,
    categoryParam,
    subcategoryParam,
    searchParam,
  ]);

  // Filter handlers
  const handleCategoryChange = (category: string) =>
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );

  const handleColorChange = (color: string) =>
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );

  const handleSizeChange = (size: string) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );

  const handleDiscountChange = (discount: number) =>
    setSelectedDiscounts((prev) =>
      prev.includes(discount)
        ? prev.filter((d) => d !== discount)
        : [...prev, discount]
    );

  const clearAllFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedDiscounts([]);
  };

  const handleProductClick = (productId: number | string) => {
    window.open(`/products/${productId}`, "_blank");
  };

  const activeFiltersCount =
    (priceRange[1] < 5000 ? 1 : 0) +
    selectedCategories.length +
    selectedColors.length +
    selectedSizes.length +
    selectedDiscounts.length;

  // Dynamic page title
  const getPageTitle = () => {
    if (categoryParam && subcategoryParam) {
      return `${categoryParam} - ${subcategoryParam}`;
    } else if (categoryParam) {
      return categoryParam;
    } else if (searchParam) {
      return `Search: ${searchParam}`;
    }
    return "All Products";
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showSecond, setShowSecond] = useState(false);
    const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();

    const stableId = (product as unknown as { _id?: string })._id ?? product.id;
    const isWishlisted = wishlist.some(
      (p) => ((p as unknown as { _id?: string })._id ?? p.id) === stableId
    );
    const addedToCart = useMemo(
      () =>
        cartItems.some(
          (i: unknown) =>
            ((i as unknown as { _id?: string })._id ??
              (i as unknown as { id?: string }).id) === stableId
        ),
      [cartItems, stableId]
    );

    const handleAddToCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      addToCart({ ...product, qty: 1 });
    };

    const handleWishlistClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isWishlisted) removeFromWishlist(stableId);
      else addToWishlist(product);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = setTimeout(() => setShowSecond(true), 1000);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      setShowSecond(false);
    };

    return (
      <div
        className="bg-white shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer lg:w-53 w-45 max-w-sm mx-auto my-2.5"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleProductClick(stableId)}
      >
        <div className="relative h-60 lg:h-75 overflow-hidden">
          {/* Bottom image (next image) */}
          <img
            src={product.images[1] ?? product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Top image slides up on hover to reveal the next image */}
          <img
            src={product.images[0]}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
              showSecond ? "-translate-y-full" : "translate-y-0"
            }`}
          />
          {/* Image tracking dots (left center) */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
            {[0, 1].map((idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  (showSecond ? 1 : 0) === idx ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 ${
              isWishlisted ? "text-red-500" : "text-white hover:text-red-500"
            }`}
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
          {isHovered && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 transition-all duration-300">
              <button
                onClick={handleAddToCart}
                className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingBag size={14} />{" "}
                {addedToCart ? "Added" : "ADD TO CART"}
              </button>
            </div>
          )}
        </div>

        <div className="p-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {product.brand}
          </p>
          <h3 className="font-medium text-gray-800 mb-1 line-clamp-2 text-sm leading-tight">
            {product.name}
          </h3>
          {/* Price and discount row */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">
              Rs. {product.price}
            </span>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
              {product.discount}% OFF
            </span>
          </div>
          {/* Original price under price with smaller font */}
          <div className="">
            <span className="text-[11px] text-gray-500 line-through">
              Rs. {product.originalPrice}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-300">
      {/* Mobile Filter Button */}

      <div className="lg:hidden fixed top-22 right-4 z-40">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="bg-white shadow-lg rounded-full p-3 relative"
        >
          <SlidersHorizontal size={20} />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      <div className="w-full mx-0 px-0 pt-16 pb-8">
        <div className="flex">
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white shadow-sm p-6 mx-2 sticky top-19">
              <div className="lg:-mt-5 mb-8">
                <DynamicBreadcrumb />
              </div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Filter size={18} /> Filters
                  {activeFiltersCount > 0 && (
                    <span className="bg-gray-900 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </h2>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Clear All
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Price Range</h3>
                <Slider
                  value={[priceRange[1]]}
                  max={5000}
                  min={0}
                  step={10}
                  onValueChange={(value) =>
                    setPriceRange([priceRange[0], value[0]])
                  }
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₹0</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Category</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                        id={`category-${category}`}
                      />
                      <label
                        htmlFor={`category-${category}`}
                        className="text-sm"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Color</h3>
                <div className="space-y-2">
                  {colors.map((color) => (
                    <div
                      key={color}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedColors.includes(color)}
                        onCheckedChange={() => handleColorChange(color)}
                        id={`color-${color}`}
                      />
                      <label htmlFor={`color-${color}`} className="text-sm">
                        {color}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Discount</h3>
                <div className="space-y-2">
                  {discounts.map((discount) => (
                    <div
                      key={discount}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedDiscounts.includes(discount)}
                        onCheckedChange={() => handleDiscountChange(discount)}
                        id={`discount-${discount}`}
                      />
                      <label
                        htmlFor={`discount-${discount}`}
                        className="text-sm"
                      >
                        {discount}% and above
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Page Title */}
            {/* <div className="mb-3 pl-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
            </div> */}
            <div className="-mt-5 lg:hidden">
              <DynamicBreadcrumb />
              
            </div>
            {/* <p className="text-gray-600 mt-1">
                {filteredProducts.length} product
                {filteredProducts.length !== 1 ? "s" : ""} found
              </p> */}

            {/* {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-600 hover:text-gray-800 mb-3"
              >
                Clear {activeFiltersCount} filter
                {activeFiltersCount > 1 ? "s" : ""}
              </button>
            )} */}

            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No products found matching your filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-900"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={
                      (product as unknown as { _id?: string })._id ?? product.id
                    }
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {mobileFiltersOpen && (
        <div
          className="lg:hidden mt-5 fixed inset-0 z-50 bg-opacity-50"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 pt-15">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              {/* Mobile filter content */}
              <div className="space-y-6">
                {/* Price Range */}
                <div>
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <Slider
                    value={[priceRange[1]]} // Shadcn Slider value as array
                    max={5000}
                    min={0}
                    step={10} // optional step
                    onValueChange={(value) =>
                      setPriceRange([priceRange[0], value[0]])
                    } // value is array
                  ></Slider>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹0</span>
                    <span>₹{priceRange[1]}</span>
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <h3 className="font-medium mb-3">Category</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryChange(category)}
                          id={`category-${category}`}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div>
                  <h3 className="font-medium mb-3">Color</h3>
                  <div className="space-y-2">
                    {colors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedColors.includes(color)}
                          onCheckedChange={() => handleColorChange(color)}
                          id={`color-${color}`}
                        />
                        <label htmlFor={`color-${color}`} className="text-sm">
                          {color}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size Filter */}
                <div>
                  <h3 className="font-medium mb-3">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <label key={size} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedSizes.includes(size)}
                          onChange={() => handleSizeChange(size)}
                          className="hidden"
                        />
                        <div
                          className={`
                    px-3 py-2 rounded border text-sm cursor-pointer transition-all
                    ${
                      selectedSizes.includes(size)
                        ? "bg-gray-600 text-white border-gray-600"
                        : "bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400"
                    }
                  `}
                        >
                          {size}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Discount Filter */}
                <div>
                  <h3 className="font-medium mb-3">Discount</h3>
                  <div className="space-y-2">
                    {discounts.map((discount) => (
                      <div
                        key={discount}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedDiscounts.includes(discount)}
                          onCheckedChange={() => handleDiscountChange(discount)}
                          id={`discount-${discount}`}
                        />
                        <label
                          htmlFor={`discount-${discount}`}
                          className="text-sm"
                        >
                          {discount}% and above
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear All Filters Button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={clearAllFilters}
                    className="w-full bg-gray-900 hover:bg-gray-200 text-gray-100 py-3 rounded-lg font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading component for Suspense fallback
function ProductsPageLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading products...</span>
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
