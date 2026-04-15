import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, MapPin, Lock, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { listingsApi, type ListingSummary } from '@/api/listingsApi'
import Layout from '@/components/Layout'
import Loader from '@/components/Loader'
import EmptyState from '@/components/EmptyState'

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop'

function MyListingsPage() {
  const queryClient = useQueryClient()

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: listingsApi.getMine,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => listingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      toast.success('Annonce supprimée.')
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error('Annonce verrouillée : une candidature est en cours.')
        return
      }
      toast.error('Impossible de supprimer cette annonce.')
    },
  })

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Mes biens immobiliers</h1>
          <Link
            to="/listings/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle annonce
          </Link>
        </div>

        {isLoading ? (
          <Loader />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aucune annonce pour le moment"
            description="Publiez votre première annonce et commencez à recevoir des candidatures."
            actionLabel="Ajouter un bien"
            actionTo="/listings/new"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {listings.map((listing) => (
              <MyListingCard
                key={listing.id}
                listing={listing}
                onDelete={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
                    deleteMutation.mutate(listing.id)
                  }
                }}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function MyListingCard({
  listing,
  onDelete,
  isDeleting,
}: {
  listing: ListingSummary
  onDelete: () => void
  isDeleting: boolean
}) {
  const locked = listing.locked
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
          {locked && (
            <span className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-white text-xs font-medium px-2 py-0.5 rounded">
              <Lock className="h-3 w-3" />
              Non modifiable
            </span>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/listings/${listing.id}`}>
          <h3 className="font-semibold text-sm mb-1 hover:text-indigo-600 transition-colors truncate">
            {listing.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
          <MapPin className="h-3 w-3" />
          {listing.city}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-indigo-600 font-bold">
            {listing.price}€<span className="text-xs font-normal text-gray-400">/mois</span>
          </span>
          <Link
            to={`/listings/${listing.id}`}
            className="text-xs text-indigo-600 hover:underline"
          >
            Voir le bien
          </Link>
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
          {locked ? (
            <span
              className="flex items-center gap-1 text-xs text-gray-400 cursor-not-allowed"
              title="Cette annonce a une candidature en cours"
            >
              <Pencil className="h-3 w-3" />
              Éditer
            </span>
          ) : (
            <Link
              to={`/listings/${listing.id}/edit`}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <Pencil className="h-3 w-3" />
              Éditer
            </Link>
          )}
          <button
            onClick={onDelete}
            disabled={isDeleting || locked}
            title={locked ? 'Cette annonce a une candidature en cours' : undefined}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors ml-auto disabled:text-gray-400 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export default MyListingsPage
