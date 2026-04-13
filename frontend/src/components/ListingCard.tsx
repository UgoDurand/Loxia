import { Link } from 'react-router-dom'
import { MapPin, Maximize2, BedDouble } from 'lucide-react'
import type { ListingSummary } from '@/api/listingsApi'

interface ListingCardProps {
  listing: ListingSummary
  showActions?: boolean
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop'

function ListingCard({ listing, showActions }: ListingCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/listings/${listing.id}`}>
        <div className="relative h-44 bg-gray-200">
          <img
            src={listing.photoUrl || PLACEHOLDER_IMG}
            alt={listing.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMG
            }}
          />
          <span className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-medium px-2 py-0.5 rounded">
            {listing.propertyType}
          </span>
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/listings/${listing.id}`}>
          <h3 className="font-semibold text-sm mb-1 hover:text-indigo-600 transition-colors truncate">
            {listing.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin className="h-3 w-3" />
          {listing.city}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            {listing.surface} m²
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="h-3 w-3" />
            {listing.rooms}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-indigo-600 font-bold">{listing.price}€<span className="text-xs font-normal text-gray-400">/mois</span></span>
          {showActions && (
            <Link
              to={`/listings/${listing.id}`}
              className="text-xs text-indigo-600 hover:underline"
            >
              Voir le bien
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListingCard
