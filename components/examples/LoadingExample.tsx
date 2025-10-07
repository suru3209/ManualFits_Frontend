"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LoadingPage,
  LoadingOverlay,
  Spinner,
  Skeleton,
  ProductSkeleton,
  useGlobalLoading,
} from "@/components/ui/loading";
import { useLoading } from "@/hooks/useLoading";

export default function LoadingExample() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showPage, setShowPage] = useState(false);
  const { startLoading, stopLoading, withLoading } = useLoading();
  const { startLoading: startGlobal, stopLoading: stopGlobal } =
    useGlobalLoading();

  // Example of using withLoading hook
  const simulateAsyncOperation = withLoading(async (delay: number = 2000) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    return "Operation completed!";
  });

  const handleAsyncOperation = async () => {
    try {
      const result = await simulateAsyncOperation(3000);
      console.log(result);
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleGlobalLoading = () => {
    startGlobal("Processing your request...");
    setTimeout(() => {
      stopGlobal();
    }, 3000);
  };

  if (showPage) {
    return <LoadingPage message="Loading example page..." />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Loading Components Demo</h1>
        <p className="text-gray-600">
          Examples of different loading states and components
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Loading Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Loading States</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Spinner size="sm" />
              <span>Small spinner</span>
            </div>
            <div className="flex items-center space-x-4">
              <Spinner size="md" />
              <span>Medium spinner</span>
            </div>
            <div className="flex items-center space-x-4">
              <Spinner size="lg" />
              <span>Large spinner</span>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Skeleton Loading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
          </CardContent>
        </Card>

        {/* Interactive Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Interactive Loading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleAsyncOperation} className="w-full">
              Simulate Async Operation
            </Button>
            <Button
              onClick={handleGlobalLoading}
              variant="outline"
              className="w-full"
            >
              Global Loading Overlay
            </Button>
            <Button
              onClick={() => setShowOverlay(!showOverlay)}
              variant="secondary"
              className="w-full"
            >
              Toggle Overlay
            </Button>
            <Button
              onClick={() => setShowPage(!showPage)}
              variant="destructive"
              className="w-full"
            >
              Show Full Page Loading
            </Button>
          </CardContent>
        </Card>

        {/* Product Skeleton Example */}
        <Card>
          <CardHeader>
            <CardTitle>Product Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSkeleton />
          </CardContent>
        </Card>
      </div>

      {/* Overlay Example */}
      <LoadingOverlay
        isVisible={showOverlay}
        message="Processing your request..."
      />
    </div>
  );
}
