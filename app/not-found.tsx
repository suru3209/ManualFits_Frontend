"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-6 flex items-center justify-center w-24 h-24 bg-red-100 rounded-full">
              <span className="text-6xl font-bold text-red-600">4</span>
              <span className="text-6xl font-bold text-red-600">0</span>
              <span className="text-6xl font-bold text-red-600">4</span>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-800 mb-4">
              Oops! Page Not Found
            </CardTitle>
            <p className="text-lg text-gray-600 leading-relaxed">
              The page you&apos;re looking for seems to have vanished into the
              digital void. Don&apos;t worry, even the best explorers sometimes
              take a wrong turn!
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-6">
                Here are some helpful links to get you back on track:
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button className="w-full sm:w-auto" size="lg">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  size="lg"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>

                <Link href="/search">
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto"
                    size="lg"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Products
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Popular Pages
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/products">
                    <Button variant="ghost" size="sm">
                      Products
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="ghost" size="sm">
                      Cart
                    </Button>
                  </Link>
                  <Link href="/wishlist">
                    <Button variant="ghost" size="sm">
                      Wishlist
                    </Button>
                  </Link>
                  <Link href="/account/dashboard">
                    <Button variant="ghost" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Link href="/about">
                    <Button variant="ghost" size="sm">
                      About
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="ghost" size="sm">
                      Contact
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
