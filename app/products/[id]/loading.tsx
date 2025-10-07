import { Skeleton } from "@/components/ui/loading";

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-96 w-full rounded-lg" />
            <div className="flex space-x-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <div className="flex space-x-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded" />
                  ))}
                </div>
              </div>

              <div>
                <Skeleton className="h-4 w-12 mb-2" />
                <div className="flex space-x-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-12 rounded" />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
