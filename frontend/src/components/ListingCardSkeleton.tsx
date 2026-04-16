function ListingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Image placeholder */}
      <div className="h-44 bg-gray-200 animate-pulse" />
      <div className="p-4 space-y-2">
        {/* Type badge */}
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        {/* Title */}
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        {/* City */}
        <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
        {/* Stats row */}
        <div className="flex gap-3 pt-1">
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Price */}
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mt-1" />
      </div>
    </div>
  )
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default ListingCardSkeleton
