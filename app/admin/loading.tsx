import { Skeleton, TableSkeleton } from "@/components/ui/loading";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>

            {/* Table section */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <Skeleton className="h-6 w-32 mb-4" />
              <TableSkeleton rows={8} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
