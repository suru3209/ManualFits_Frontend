import { ProductSkeleton } from "@/components/ui/loading";

const about = () => {
  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
        <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>  )
}

export default about