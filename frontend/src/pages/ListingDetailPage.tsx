import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Maximize2, BedDouble, User, Lock } from 'lucide-react'
import { listingsApi } from '@/api/listingsApi'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/Layout'

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop'

function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </Layout>
    )
  }

  if (error || !listing) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-red-500">Annonce introuvable.</p>
          <Link to="/" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
            Retour
          </Link>
        </div>
      </Layout>
    )
  }

  const isOwner = user?.id === listing.ownerId
  const photos = listing.photoUrls?.length ? listing.photoUrls : [PLACEHOLDER_IMG]

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Photo */}
          <div className="relative h-72 sm:h-96 bg-gray-200">
            <img
              src={photos[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = PLACEHOLDER_IMG
              }}
            />
            <span className="absolute top-3 left-3 bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded">
              {listing.propertyType}
            </span>
            {isOwner && listing.locked && (
              <span className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500 text-white text-sm font-medium px-3 py-1 rounded">
                <Lock className="h-4 w-4" />
                Non modifiable
              </span>
            )}
          </div>

          <div className="p-6 sm:flex sm:gap-8">
            {/* Left: info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{listing.title}</h1>

              <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                <MapPin className="h-4 w-4" />
                {listing.city}
              </div>

              {listing.ownerName && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                  <User className="h-4 w-4" />
                  Proposé par <strong>{listing.ownerName}</strong>
                </div>
              )}

              <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                <span className="flex items-center gap-1">
                  <Maximize2 className="h-4 w-4" />
                  {listing.surface} m²
                </span>
                <span className="flex items-center gap-1">
                  <BedDouble className="h-4 w-4" />
                  {listing.rooms} chambre{listing.rooms > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Right: price + CTA */}
            <div className="sm:text-right">
              <p className="text-2xl font-bold text-indigo-600 mb-1">
                {listing.price}€<span className="text-sm font-normal text-gray-400">/mois</span>
              </p>

              {isOwner ? (
                listing.locked ? (
                  <span
                    className="inline-flex items-center gap-1 mt-3 bg-gray-200 text-gray-500 text-sm font-medium px-5 py-2.5 rounded-lg cursor-not-allowed"
                    title="Cette annonce a une candidature en cours et ne peut pas être modifiée"
                  >
                    <Lock className="h-4 w-4" />
                    Non modifiable
                  </span>
                ) : (
                  <Link
                    to={`/listings/${listing.id}/edit`}
                    className="inline-block mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                  >
                    Modifier cette annonce
                  </Link>
                )
              ) : isAuthenticated ? (
                <Link
                  to={`/listings/${listing.id}/apply`}
                  className="inline-block mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                >
                  Postuler en ligne
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="inline-block mt-3 bg-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-lg"
                >
                  Connectez-vous pour postuler
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="px-6 pb-6">
              <h2 className="font-semibold mb-2">À propos du logement</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default ListingDetailPage
