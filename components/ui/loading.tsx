import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

// Spinner component
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-8 w-8",
      lg: "h-12 w-12",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Spinner.displayName = "Spinner";

// Skeleton component for loading placeholders
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
          width && `w-${width}`,
          height && `h-${height}`,
          className
        )}
        style={{
          width:
            width?.includes("px") || width?.includes("%") ? width : undefined,
          height:
            height?.includes("px") || height?.includes("%")
              ? height
              : undefined,
        }}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

// Loading page component
interface LoadingPageProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  showSpinner?: boolean;
  variant?: "default" | "minimal" | "card";
}

const LoadingPage = React.forwardRef<HTMLDivElement, LoadingPageProps>(
  (
    {
      message = "Loading...",
      showSpinner = true,
      variant = "default",
      className,
      ...props
    },
    ref
  ) => {
    if (variant === "minimal") {
      return (
        <div
          ref={ref}
          className={cn("flex items-center justify-center p-4", className)}
          {...props}
        >
          <div className="flex items-center space-x-2">
            {showSpinner && <Spinner size="sm" />}
            <span className="text-sm text-gray-600">{message}</span>
          </div>
        </div>
      );
    }

    if (variant === "card") {
      return (
        <Card className={cn("w-full max-w-md mx-auto", className)} {...props}>
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            {showSpinner && <Spinner size="lg" />}
            <p className="text-lg font-medium text-gray-700">{message}</p>
          </CardContent>
        </Card>
      );
    }

    // Default variant
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen flex items-center justify-center bg-gray-50",
          className
        )}
        {...props}
      >
        <div className="text-center space-y-4">
          {showSpinner && (
            <div className="flex justify-center">
              <Spinner size="lg" />
            </div>
          )}
          <h2 className="text-xl font-semibold text-gray-700">{message}</h2>
          <p className="text-sm text-gray-500">
            Please wait while we load your content...
          </p>
        </div>
      </div>
    );
  }
);
LoadingPage.displayName = "LoadingPage";

// Loading overlay component
interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
  message?: string;
  transparent?: boolean;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  (
    {
      isVisible,
      message = "Loading...",
      transparent = false,
      className,
      ...props
    },
    ref
  ) => {
    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center",
          transparent ? "bg-black/20" : "bg-white/90",
          className
        )}
        {...props}
      >
        <div className="flex flex-col items-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
      </div>
    );
  }
);
LoadingOverlay.displayName = "LoadingOverlay";

// Product skeleton for loading states
const ProductSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Card ref={ref} className={cn("w-full", className)} {...props}>
    <CardContent className="p-4">
      <div className="space-y-3">
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));
ProductSkeleton.displayName = "ProductSkeleton";

// Table skeleton for loading states
const TableSkeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { rows?: number }
>(({ className, rows = 5, ...props }, ref) => (
  <div ref={ref} className={cn("w-full", className)} {...props}>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  </div>
));
TableSkeleton.displayName = "TableSkeleton";

export {
  Spinner,
  Skeleton,
  LoadingPage,
  LoadingOverlay,
  ProductSkeleton,
  TableSkeleton,
};
