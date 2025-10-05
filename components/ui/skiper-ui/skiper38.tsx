"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Menu, Plus } from "lucide-react";
import { CircleUser } from "lucide-react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "../../../context/CartContext";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// Types
type MenuItem = {
  title: string;
  items: {
    label: string;
    href: string;
  }[];
};

type MenuContent = {
  firstUl: MenuItem;
  secondUl: MenuItem;
  thirdUl: MenuItem;
};

type MenuData = Record<string, MenuContent>;

// Helper function to create links
const createLink = (text: string, basePath: string = "") => {
  const path = text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${basePath}/${path}`;
};

// Data
const NAVIGATION_ITEMS = [
  { label: "New Arrivals", href: "/products?category=New Arrivals" },
  { label: "Men", href: "/products?category=Men" },
  { label: "Women", href: "/products?category=Women" },
  // { label: "Kids", href: "/products?category=Kids" },
  { label: "Accessories", href: "/products?category=Accessories" },
  { label: "Footwear", href: "/products?category=Footwear" },
  // { label: "Winter Collection", href: "/products?category=Winter Collection" },
  // { label: "Summer Collection", href: "/products?category=Summer Collection" },
  // { label: "Sale", href: "/products?category=Sale" },
  // { label: "Brands", href: "/products?category=Brands" },
] as const;

const MENU_CONTENT: MenuData = {
  "New Arrivals": {
    firstUl: {
      title: "Latest Drops",
      items: [
        {
          label: "Just Launched",
          href: "/products?category=New Arrivals&subcategory=Just Launched",
        },
        {
          label: "Trending Now",
          href: "/products?category=New Arrivals&subcategory=Trending Now",
        },
        {
          label: "Limited Edition",
          href: "/products?category=New Arrivals&subcategory=Limited Edition",
        },
        {
          label: "Designer Collabs",
          href: "/products?category=New Arrivals&subcategory=Designer Collabs",
        },
        {
          label: "Seasonal Picks",
          href: "/products?category=New Arrivals&subcategory=Seasonal Picks",
        },
        {
          label: "Celebrity Styles",
          href: "/products?category=New Arrivals&subcategory=Celebrity Styles",
        },
        {
          label: "Viral Fashions",
          href: "/products?category=New Arrivals&subcategory=Viral Fashions",
        },
      ],
    },
    secondUl: {
      title: "Shop By Category",
      items: [
        {
          label: "Men's New Arrivals",
          href: "/products?category=Men&subcategory=New Arrivals",
        },
        {
          label: "Women's New Arrivals",
          href: "/products?category=Women&subcategory=New Arrivals",
        },
        {
          label: "Kids' New Arrivals",
          href: "/products?category=Kids&subcategory=New Arrivals",
        },
        {
          label: "Accessory Updates",
          href: "/products?category=Accessories&subcategory=New Arrivals",
        },
        {
          label: "Footwear Launches",
          href: "/products?category=Footwear&subcategory=New Arrivals",
        },
        {
          label: "Exclusive Collections",
          href: "/products?category=New Arrivals&subcategory=Exclusive",
        },
      ],
    },
    thirdUl: {
      title: "Quick Links",
      items: [
        { label: "Find a Store", href: "/store-locator" },
        { label: "Style Guide", href: "/style-guide" },
        { label: "Size Chart", href: "/size-chart" },
        { label: "Contact Us", href: "/contact" },
        { label: "Track Order", href: "/track-order" },
        { label: "Return Policy", href: "/return-policy" },
      ],
    },
  },
  Men: {
    firstUl: {
      title: "Men's Clothing",
      items: [
        {
          label: "T-Shirts & Polos",
          href: "/products?category=Men&subcategory=T-Shirts",
        },
        {
          label: "Shirts & Formal Wear",
          href: "/products?category=Men&subcategory=Shirts",
        },
        {
          label: "Jeans & Trousers",
          href: "/products?category=Men&subcategory=Jeans",
        },
        {
          label: "Jackets & Coats",
          href: "/products?category=Men&subcategory=Jackets",
        },
        {
          label: "Sportswear",
          href: "/products?category=Men&subcategory=Sportswear",
        },
        {
          label: "Ethnic Wear",
          href: "/products?category=Men&subcategory=Ethnic Wear",
        },
        {
          label: "Innerwear",
          href: "/products?category=Men&subcategory=Innerwear",
        },
      ],
    },
    secondUl: {
      title: "Shop By Style",
      items: [
        {
          label: "Casual Wear",
          href: "/products?category=Men&subcategory=Casual Wear",
        },
        {
          label: "Office Wear",
          href: "/products?category=Men&subcategory=Office Wear",
        },
        {
          label: "Party Wear",
          href: "/products?category=Men&subcategory=Party Wear",
        },
        {
          label: "Sports & Gym",
          href: "/products?category=Men&subcategory=Sports",
        },
        {
          label: "Traditional",
          href: "/products?category=Men&subcategory=Traditional",
        },
        {
          label: "Street Style",
          href: "/products?category=Men&subcategory=Street Style",
        },
      ],
    },
    thirdUl: {
      title: "More from Men",
      items: [
        { label: "Men's Size Guide", href: "/size-guide/men" },
        { label: "Style Inspiration", href: "/style-inspiration/men" },
        { label: "Grooming Products", href: "/grooming" },
        { label: "Accessory Guide", href: "/accessories/men" },
        { label: "Customer Reviews", href: "/reviews/men" },
      ],
    },
  },
  Women: {
    firstUl: {
      title: "Women's Fashion",
      items: [
        {
          label: "Dresses & Gowns",
          href: "/products?category=Women&subcategory=Dresses",
        },
        {
          label: "Tops & Tees",
          href: "/products?category=Women&subcategory=Tops",
        },
        {
          label: "Jeans & Pants",
          href: "/products?category=Women&subcategory=Jeans",
        },
        {
          label: "Skirts & Shorts",
          href: "/products?category=Women&subcategory=Skirts",
        },
        {
          label: "Ethnic Wear",
          href: "/products?category=Women&subcategory=Ethnic Wear",
        },
        {
          label: "Winter Collection",
          href: "/products?category=Women&subcategory=Winter",
        },
        {
          label: "Lingerie",
          href: "/products?category=Women&subcategory=Lingerie",
        },
      ],
    },
    secondUl: {
      title: "Shop By Occasion",
      items: [
        {
          label: "Casual Daywear",
          href: "/products?category=Women&subcategory=Casual Daywear",
        },
        {
          label: "Office Formals",
          href: "/products?category=Women&subcategory=Office Formals",
        },
        {
          label: "Party & Evening",
          href: "/products?category=Women&subcategory=Party Evening",
        },
        {
          label: "Wedding Collection",
          href: "/products?category=Women&subcategory=Wedding",
        },
        {
          label: "Beach & Vacation",
          href: "/products?category=Women&subcategory=Beach",
        },
        {
          label: "Festive Specials",
          href: "/products?category=Women&subcategory=Festive",
        },
      ],
    },
    thirdUl: {
      title: "More from Women",
      items: [
        { label: "Women's Size Guide", href: "/size-guide/women" },
        { label: "Style Blog", href: "/blog/women" },
        { label: "Beauty Products", href: "/beauty" },
        { label: "Jewelry Collection", href: "/jewelry" },
        { label: "Customer Favorites", href: "/women/customer-favorites" },
      ],
    },
  },
  // "Kids": {
  //   firstUl: {
  //     title: "Kids Fashion",
  //     items: [
  //       { label: "Boys Clothing", href: "/kids/boys-clothing" },
  //       { label: "Girls Clothing", href: "/kids/girls-clothing" },
  //       { label: "Baby Wear", href: "/kids/baby-wear" },
  //       { label: "School Uniforms", href: "/kids/school-uniforms" },
  //       { label: "Party Wear", href: "/kids/party-wear" },
  //       { label: "Sports Wear", href: "/kids/sports-wear" },
  //       { label: "Accessories", href: "/kids/accessories" },
  //     ],
  //   },
  //   secondUl: {
  //     title: "Age Groups",
  //     items: [
  //       { label: "Newborn (0-12M)", href: "/kids/newborn" },
  //       { label: "Toddlers (1-3Y)", href: "/kids/toddlers" },
  //       { label: "Kids (4-8Y)", href: "/kids/kids" },
  //       { label: "Pre-teens (9-12Y)", href: "/kids/pre-teens" },
  //       { label: "Teens (13-16Y)", href: "/kids/teens" },
  //     ],
  //   },
  //   thirdUl: {
  //     title: "More from Kids",
  //     items: [
  //       { label: "Kids Size Guide", href: "/size-guide/kids" },
  //       { label: "Safety & Quality", href: "/safety-quality" },
  //       { label: "Gift Ideas", href: "/gift-ideas/kids" },
  //       { label: "Character Collection", href: "/kids/character-collection" },
  //       { label: "Parent Reviews", href: "/reviews/kids" },
  //     ],
  //   },
  // },
  // Similarly update other categories...
  Accessories: {
    firstUl: {
      title: "Accessories",
      items: [
        {
          label: "Bags & Backpacks",
          href: "/products?category=Accessories&subcategory=Bags",
        },
        {
          label: "Watches",
          href: "/products?category=Accessories&subcategory=Watches",
        },
        {
          label: "Jewelry",
          href: "/products?category=Accessories&subcategory=Jewelry",
        },
        {
          label: "Sunglasses",
          href: "/products?category=Accessories&subcategory=Sunglasses",
        },
        {
          label: "Belts & Wallets",
          href: "/products?category=Accessories&subcategory=Belts",
        },
        {
          label: "Hats & Caps",
          href: "/products?category=Accessories&subcategory=Hats",
        },
        {
          label: "Scarves & Stoles",
          href: "/products?category=Accessories&subcategory=Scarves",
        },
      ],
    },
    secondUl: {
      title: "Shop By Type",
      items: [
        {
          label: "Men's Accessories",
          href: "/products?category=Accessories&subcategory=Men",
        },
        {
          label: "Women's Accessories",
          href: "/products?category=Accessories&subcategory=Women",
        },
        {
          label: "Kids Accessories",
          href: "/products?category=Accessories&subcategory=Kids",
        },
        {
          label: "Luxury Collection",
          href: "/products?category=Accessories&subcategory=Luxury",
        },
        {
          label: "Everyday Essentials",
          href: "/products?category=Accessories&subcategory=Essentials",
        },
      ],
    },
    thirdUl: {
      title: "More from Accessories",
      items: [
        { label: "Style Guide", href: "/style-guide/accessories" },
        { label: "Gift Cards", href: "/gift-cards" },
        { label: "Personalization", href: "/personalization" },
        { label: "Care Instructions", href: "/care-instructions" },
        { label: "Accessory Trends", href: "/trends/accessories" },
      ],
    },
  },
  Footwear: {
    firstUl: {
      title: "Footwear",
      items: [
        {
          label: "Sneakers & Sports",
          href: "/products?category=Footwear&subcategory=Sneakers",
        },
        {
          label: "Formal Shoes",
          href: "/products?category=Footwear&subcategory=Formal Shoes",
        },
        {
          label: "Casual Shoes",
          href: "/products?category=Footwear&subcategory=Casual Shoes",
        },
        {
          label: "Sandals & Flip-flops",
          href: "/products?category=Footwear&subcategory=Sandals",
        },
        {
          label: "Boots",
          href: "/products?category=Footwear&subcategory=Boots",
        },
        {
          label: "Heels & Wedges",
          href: "/products?category=Footwear&subcategory=Heels",
        },
        {
          label: "Ethnic Footwear",
          href: "/products?category=Footwear&subcategory=Ethnic",
        },
      ],
    },
    secondUl: {
      title: "Shop By Category",
      items: [
        {
          label: "Men's Footwear",
          href: "/products?category=Footwear&subcategory=Men",
        },
        {
          label: "Women's Footwear",
          href: "/products?category=Footwear&subcategory=Women",
        },
        {
          label: "Kids Footwear",
          href: "/products?category=Footwear&subcategory=Kids",
        },
        {
          label: "Sports Shoes",
          href: "/products?category=Footwear&subcategory=Sports Shoes",
        },
        {
          label: "Seasonal Footwear",
          href: "/products?category=Footwear&subcategory=Seasonal",
        },
      ],
    },
    thirdUl: {
      title: "More from Footwear",
      items: [
        { label: "Size Guide", href: "/size-guide/footwear" },
        { label: "Comfort Technology", href: "/technology/comfort" },
        { label: "Care & Maintenance", href: "/care/footwear" },
        { label: "Trending Styles", href: "/trends/footwear" },
        { label: "Customer Reviews", href: "/reviews/footwear" },
      ],
    },
  },
  "Winter Collection": {
    firstUl: {
      title: "Winter Wear",
      items: [
        { label: "Jackets & Coats", href: "/winter/jackets-coats" },
        { label: "Sweaters & Hoodies", href: "/winter/sweaters-hoodies" },
        { label: "Thermal Wear", href: "/winter/thermal-wear" },
        { label: "Winter Accessories", href: "/winter/accessories" },
        { label: "Boots & Footwear", href: "/winter/footwear" },
        { label: "Winter Dresses", href: "/winter/dresses" },
        { label: "Kids Winter Wear", href: "/winter/kids" },
      ],
    },
    secondUl: {
      title: "Shop By Material",
      items: [
        { label: "Woolen Collection", href: "/winter/woolen" },
        { label: "Fleece & Thermal", href: "/winter/fleece-thermal" },
        { label: "Leather Jackets", href: "/winter/leather" },
        { label: "Puffer Coats", href: "/winter/puffer-coats" },
        { label: "Cashmere & Premium", href: "/winter/cashmere-premium" },
      ],
    },
    thirdUl: {
      title: "Winter Essentials",
      items: [
        { label: "Winter Style Guide", href: "/style-guide/winter" },
        { label: "Layering Tips", href: "/tips/layering" },
        { label: "Gift Ideas", href: "/gift-ideas/winter" },
        { label: "Winter Sale", href: "/sale/winter" },
        { label: "Seasonal Offers", href: "/offers/seasonal" },
      ],
    },
  },
};

// Animation variants
const menuItemVariants = {
  hidden: { opacity: 0, y: "-20%" },
  visible: { opacity: 1, y: 0 },
};

const menuContainerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

// Components
const MenuSection = ({
  title,
  items,
  isLarge = false,
}: {
  title: string;
  items: { label: string; href: string }[];
  isLarge?: boolean;
}) => (
  <motion.ul
    className="space-y-2"
    initial="hidden"
    animate="visible"
    exit="hidden"
    variants={menuContainerVariants}
  >
    <motion.li
      variants={menuItemVariants}
      transition={{ duration: 0.3 }}
      className="my-4 text-xs opacity-50"
    >
      {title}
    </motion.li>
    {items.map((item, index) => (
      <motion.li
        key={index}
        variants={menuItemVariants}
        transition={{ duration: 0.3 }}
        className={cn(
          "cursor-pointer tracking-tight",
          isLarge
            ? "group relative flex items-center text-2xl font-[600]"
            : "text-sm font-[500]"
        )}
      >
        <Link href={item.href} className="flex items-center w-full">
          {item.label}
          {isLarge && (
            <ChevronRight className="absolute -right-10 size-6 opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100" />
          )}
        </Link>
      </motion.li>
    ))}
  </motion.ul>
);

const AppleIcon = ({
  children,
  isMenuOpen,
}: {
  children: React.ReactNode;
  isMenuOpen: boolean;
}) => (
  <motion.span
    animate={{ opacity: isMenuOpen ? 0 : 1 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.span>
);

const AppleSearch = () => (
  <svg
    className="h-12 lg:h-10"
    viewBox="0 0 17 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m16.2294 29.9556-4.1755-4.0821a6.4711 6.4711 0 1 0 -1.2839 1.2625l4.2005 4.1066a.9.9 0 1 0 1.2588-1.287zm-14.5294-8.0017a5.2455 5.2455 0 1 1 5.2455 5.2527 5.2549 5.2549 0 0 1 -5.2455-5.2527z" />
  </svg>
);

const AppleBag = () => (
  <svg
    className="h-12 lg:h-15"
    viewBox="0 0 17 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m13.4575 16.9268h-1.1353a3.8394 3.8394 0 0 0 -7.6444 0h-1.1353a2.6032 2.6032 0 0 0 -2.6 2.6v8.9232a2.6032 2.6032 0 0 0 2.6 2.6h9.915a2.6032 2.6032 0 0 0 2.6-2.6v-8.9231a2.6032 2.6032 0 0 0 -2.6-2.6001zm-4.9575-2.2768a2.658 2.658 0 0 1 2.6221 2.2764h-5.2442a2.658 2.658 0 0 1 2.6221-2.2764zm6.3574 13.8a1.4014 1.4014 0 0 1 -1.4 1.4h-9.9149a1.4014 1.4014 0 0 1 -1.4-1.4v-8.9231a1.4014 1.4014 0 0 1 1.4-1.4h9.915a1.4014 1.4014 0 0 1 1.4 1.4z" />
  </svg>
);

const MobileMenu = ({
  items,
  isOpen,
  onCloseMenu,
}: {
  items: typeof NAVIGATION_ITEMS;
  isOpen: boolean;
  onCloseMenu: () => void;
}) => (
  <div className="pt-15 h-screen w-screen bg-white backdrop-blur-2xl">
    <motion.ul
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
          },
        },
      }}
      className="flex flex-col gap-5 text-3xl font-[600] tracking-tight"
    >
      {items.map((item, index) => (
        <motion.li
          key={index}
          variants={{
            hidden: { opacity: 0, y: "-10%" },
            visible: { opacity: 1, y: 0 },
          }}
          className="group relative flex cursor-pointer items-center justify-between px-8"
        >
          <Link
            href={item.href}
            className="flex items-center justify-between w-full"
            onClick={onCloseMenu}
          >
            {item.label}
            <ChevronRight className="size-6 opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100" />
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  </div>
);

const AppleNavbar = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentContent = hoveredItem ? MENU_CONTENT[hoveredItem] : null;
  const showMenu = hoveredItem || isMenuOpen;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  //login
  const user =
    typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const isLoggedIn = !!user;

  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query)}`);
      setIsOpen(false); // input band kar dena
      setQuery(""); // clear kar dena
    }
  };

  // Outside click detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
  // conext for cart

  // const [cartItems, setCartItems] = useState([
  //   { id: 1, name: "Product A", qty: 2 },
  //   { id: 2, name: "Product B", qty: 1 },
  // ]);

  const { totalItems } = useCart();

  return (
    <nav className="fixed z-990 top-0 shadow-md flex w-screen flex-col items-center justify-center">
      {/* Header */}
      <div className="relative z-20 flex w-full items-center justify-center bg-white">
        <ul className="flex w-full max-w-[1024px] items-center justify-between gap-5 bg-white px-5 text-xs lg:px-0">
          <motion.li
            className="text-lg"
            animate={{ opacity: isMenuOpen ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {/*  */}
            <Link href="/">
              {" "}
              <img className="w-10 lg:w-12" src="/logo2.png" alt="" />
            </Link>
          </motion.li>

          {/* Desktop Navigation */}
          {NAVIGATION_ITEMS.map((item, index) => (
            <li
              key={index}
              className="hidden cursor-pointer lg:block"
              onMouseEnter={() => setHoveredItem(item.label)}
            >
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}

          {/* Icons */}
          <li className="flex items-center justify-center gap-5 lg:gap-8">
            <AppleIcon isMenuOpen={isMenuOpen}>
              <div ref={searchRef} className="relative flex items-center">
                {/* Show icon only when input is closed */}
                {!isOpen && (
                  <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-full hover:bg-gray-200 transition"
                  >
                    <AppleSearch />
                  </button>
                )}

                {/* Input Field */}
                {isOpen && (
                  <div className="ml-2 relative">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown} // ✅ Enter handle
                      placeholder="Search products..."
                      className="pl-3 pr-10 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-700 transition w-60"
                      autoFocus
                    />
                    {/* Icon inside input on right side */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <AppleSearch />
                    </div>
                  </div>
                )}
              </div>
            </AppleIcon>
            <AppleIcon isMenuOpen={isMenuOpen}>
              <Tooltip open={!isLoggedIn}>
                <TooltipTrigger asChild>
                  <Link
                    href={isLoggedIn ? "/account/dashboard" : "/account/login"}
                  >
                    <CircleUser className="opacity-79" />
                  </Link>
                </TooltipTrigger>
                {!isLoggedIn && (
                  <TooltipContent
                    side="bottom"
                    className="bg-gray-800 text-white z-[9999]"
                  >
                    <p>Login & Signup</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </AppleIcon>
            <AppleIcon isMenuOpen={isMenuOpen}>
              <Link href="/wishlist">
                <Heart className="opacity-79" />
              </Link>
            </AppleIcon>
            <AppleIcon isMenuOpen={isMenuOpen}>
              <Link href="/cart" className="relative">
                <AppleBag />
                {totalItems === 0 ? (
                  ""
                ) : (
                  <span className="absolute top-3 -right-2 bg-gray-800 text-white text-xs rounded-full px-1">
                    {totalItems}
                  </span>
                )}
              </Link>
            </AppleIcon>
            <span className="cursor-pointer" onClick={toggleMenu}>
              {!isMenuOpen ? (
                <Menu className="block size-6 stroke-[1] lg:hidden lg:size-4" />
              ) : (
                <Plus className="block size-6 -rotate-45 stroke-[1] lg:hidden lg:size-4" />
              )}
            </span>
          </li>
        </ul>
      </div>

      {/* Dropdown Menu */}
      <motion.div
        initial={{ height: "0px" }}
        animate={{ height: showMenu ? "auto" : "0" }}
        transition={{ ease: [0.645, 0.045, 0.355, 1], duration: 0.5 }}
        onMouseLeave={() => setHoveredItem(null)}
        className="relative z-20 flex w-full justify-center overflow-hidden bg-white"
      >
        <AnimatePresence>
          {currentContent && (
            <motion.div
              exit={{
                opacity: 0,
                transition: { duration: 0.4, delay: 0.5 },
              }}
              className="flex w-full max-w-[1024px] gap-32 pb-20 pt-10"
            >
              <MenuSection
                title={currentContent.firstUl.title}
                items={currentContent.firstUl.items}
                isLarge
              />
              <MenuSection
                title={currentContent.secondUl.title}
                items={currentContent.secondUl.items}
              />
              <MenuSection
                title={currentContent.thirdUl.title}
                items={currentContent.thirdUl.items}
              />
            </motion.div>
          )}

          {isMenuOpen && (
            <MobileMenu
              items={NAVIGATION_ITEMS}
              isOpen={isMenuOpen}
              onCloseMenu={() => setIsMenuOpen(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Background Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: hoveredItem ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="pointer-events-none absolute left-0 top-0 z-10 h-screen w-screen bg-white/20 blur-lg backdrop-blur-xl"
      />
    </nav>
  );
};

// Main Component
const Skiper38 = () => {
  return (
    <div className="relative h-full w-full bg-[#F2F2F4] text-black">
      <AppleNavbar />
      {/* Background Image */}
      <img
        className="absolute left-0 h-[calc(100vh-1rem)] w-full rounded-2xl object-cover"
        src="https://pbs.twimg.com/media/GwY_Uc6bsAETDCF?format=jpg&name=4096x4096"
        alt=""
      />
    </div>
  );
};

export { AppleNavbar, Skiper38 };
