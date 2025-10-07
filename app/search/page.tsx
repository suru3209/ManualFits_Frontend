"use client";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { Filter, X, SlidersHorizontal, Heart, ShoppingBag } from "lucide-react";
import { Product } from "../../types/types";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import DynamicBreadcrumb from "@/lib/breadcrumb";
import { buildApiUrl } from "@/lib/api";

// Fetch products from backend
async function fetchProducts(): Promise<unknown[]> {
  const res = await fetch(buildApiUrl("/products"), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch products");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

function SearchPageContent() {
  const { addToCart, cartItems } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<unknown[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchProducts()
      .then((data) => {
        if (mounted) setProducts(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const query = searchParams.get("query")?.toLowerCase() || "";
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<number[]>([]);

  // Options
  const categories = ["Men", "Women", "Kids", "Footwear", "Accessories"];
  const colors = ["White", "Black", "Gray", "Red", "Green", "Yellow", "Pink"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const discounts = [10, 20, 30, 40, 50, 60, 70];

  // Handlers
  const handleCategoryChange = (c: string) =>
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  const handleColorChange = (c: string) =>
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  const handleSizeChange = (s: string) =>
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  const handleDiscountChange = (d: number) =>
    setSelectedDiscounts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  const clearAllFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedDiscounts([]);
  };

  const handleProductClick = (id: number | string) =>
    router.push(`/products/${id}`);

  // FILTER LOGIC
  const filteredProducts = useMemo(() => {
    console.log("Search Query:", query);
    console.log("Total Products:", products.length);

    const filtered = products.filter((product: unknown) => {
      const productData = product as {
        name?: string;
        brand?: string;
        category?: string;
        subcategory?: string;
        tags?: string[];
        sizes?: unknown[];
        sku?: string;
        description?: string;
        price?: number;
        colors?: string[];
        discount?: number;
      };
      // Search query filter
      if (query) {
        const q = query.toLowerCase();
        const inName = productData.name?.toLowerCase().includes(q);
        const inBrand = productData.brand?.toLowerCase().includes(q);
        const inCategory = productData.category?.toLowerCase().includes(q); // changed to includes for better search
        const inSubcategory = productData.subcategory
          ?.toString()
          .toLowerCase()
          .includes(q);
        const inTags = productData.tags?.some((t: string) =>
          t.toLowerCase().includes(q)
        );
        const inSku = productData.sku?.toLowerCase().includes(q);
        const inDesc = productData.description?.toLowerCase().includes(q);

        const matches =
          inName ||
          inBrand ||
          inCategory ||
          inSubcategory ||
          inTags ||
          inSku ||
          inDesc;

        if (matches) {
          console.log("Product matches:", productData.name, {
            inName,
            inBrand,
            inCategory,
            inSubcategory,
            inTags,
            inSku,
            inDesc,
          });
        }

        if (!matches) {
          return false;
        }
      }

      // Price filter
      if (
        productData.price &&
        (productData.price < priceRange[0] || productData.price > priceRange[1])
      )
        return false;

      // Category filter
      if (
        selectedCategories.length > 0 &&
        productData.category &&
        !selectedCategories.includes(productData.category)
      )
        return false;

      // Color filter
      if (
        selectedColors.length > 0 &&
        productData.colors &&
        !productData.colors.some((c: string) => selectedColors.includes(c))
      )
        return false;

      // Size filter
      if (
        selectedSizes.length > 0 &&
        productData.sizes &&
        !productData.sizes.some((s: unknown) => {
          const sizeData = s as { size?: string };
          return sizeData.size && selectedSizes.includes(sizeData.size);
        })
      )
        return false;

      // Discount filter
      if (
        selectedDiscounts.length > 0 &&
        productData.discount !== undefined &&
        !selectedDiscounts.some((d) => productData.discount! >= d)
      )
        return false;

      return true;
    });

    console.log("Filtered Products Count:", filtered.length);
    return filtered;
  }, [
    products,
    query,
    priceRange,
    selectedCategories,
    selectedColors,
    selectedSizes,
    selectedDiscounts,
  ]);

  const activeFiltersCount =
    (priceRange[1] < 5000 ? 1 : 0) +
    selectedCategories.length +
    selectedColors.length +
    selectedSizes.length +
    selectedDiscounts.length;

  const ProductCard = ({ product }: { product: Product }) => {
    const [isHovered, setIsHovered] = useState(false);
    const stableId = (product as unknown as { _id?: string })._id ?? product.id;
    const isWishlisteed = wishlist.some(
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
      isWishlisteed ? removeFromWishlist(stableId) : addToWishlist(product);
    };

    return (
      <div
        className="bg-white shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer lg:w-53 w-40 max-w-sm mx-auto my-2.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => handleProductClick(stableId)}
      >
        <div className="relative h-60 lg:h-80 overflow-hidden">
          <img
            src={isHovered ? product.images[1] : product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
          <button
            onClick={handleWishlistClick}
            className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-300 ${
              isWishlisteed ? "text-red-500" : "text-white hover:text-red-500"
            }`}
          >
            <Heart size={16} fill={isWishlisteed ? "currentColor" : "none"} />
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

        <div className="p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.brand}
          </p>
          <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 text-sm leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                Rs. {product.price}
              </span>
              <span className="text-sm text-gray-500 line-through">
                Rs. {product.originalPrice}
              </span>
            </div>
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
              {product.discount}% OFF
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen mt-10 lg:mt-15 bg-gray-300">
      <DynamicBreadcrumb />
      {/* Mobile Filter Button */}
      <div className="lg:hidden fixed top-20 left-4 z-40">
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

      <div className="container mx-auto px-4 pb-8">
        {/* Search Tag Line */}
        {query && (
          <div className="text-center mb-6">
            <p className="text-gray-700 text-lg">
              Showing {filteredProducts.length} results for:{" "}
              <span className="font-semibold">&ldquo;{query}&rdquo;</span>
            </p>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          {filteredProducts.length > 0 && (
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                {/* Filter Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Filter size={18} />
                    Filters
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

                {/* Price Range Filter */}
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
          )}
          {/* Main Content */}
          <div className="flex-1">
            {/* Products Grid */}
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
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const productData = product as { _id?: string; id?: string };
                  return (
                    <ProductCard
                      key={productData._id ?? productData.id ?? Math.random()}
                      product={product as Product}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {mobileFiltersOpen && filteredProducts.length > 0 && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
            <div className="p-4 pt-15">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Price Range */}
                <div>
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full"
                  />
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
                      <label
                        key={category}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className="rounded text-gray-600"
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Color Filter */}
                <div>
                  <h3 className="font-medium mb-3">Color</h3>
                  <div className="space-y-2">
                    {colors.map((color) => (
                      <label
                        key={color}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedColors.includes(color)}
                          onChange={() => handleColorChange(color)}
                          className="rounded text-gray-600"
                        />
                        <span className="text-sm">{color}</span>
                      </label>
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
                      <label
                        key={discount}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDiscounts.includes(discount)}
                          onChange={() => handleDiscountChange(discount)}
                          className="rounded text-gray-600"
                        />
                        <span className="text-sm">{discount}% and above</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full mt-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-900"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading component for Suspense fallback
function SearchPageLoading() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading search results...</span>
        </div>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}
