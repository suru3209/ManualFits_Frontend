import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { ToastProvider } from "../context/ToastContext";
import { LoadingProvider } from "../context/LoadingContext";
import { ConditionalLayout } from "../components/layout/ConditionalLayout";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ManualFits - Premium Clothing Store",
  description:
    "Shop trendy and premium fashion for Men, Women, and Kids. Explore the latest collections of clothing, footwear, and accessories at ManualFits.",
  keywords: [
    "manualfits",
    "online clothing store",
    "fashion e-commerce",
    "mens wear",
    "womens wear",
    "kids fashion",
    "trendy outfits",
    "buy clothes online",
  ],
  authors: [{ name: "ManualFits Team", url: "https://manualfits.com" }],
  openGraph: {
    title: "ManualFits - Premium Clothing Store",
    description:
      "Explore the latest styles in fashion. Shop for Men, Women, and Kids at ManualFits.",
    url: "https://manualfits.com",
    siteName: "ManualFits",
    images: [
      {
        url: "/logo2.png", // ✅ ek product ya banner image
        width: 1200,
        height: 630,
        alt: "ManualFits Fashion Banner",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: "/logo2.png", // ✅ logo for browser tab
  },
  metadataBase: new URL("https://manualfits.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <LoadingProvider>
                  <ConditionalLayout>{children}</ConditionalLayout>
                </LoadingProvider>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
