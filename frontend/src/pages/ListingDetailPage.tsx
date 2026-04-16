import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, MapPin, Maximize2, BedDouble, User, Lock, Home, Calendar, MessageCircle, Layers, Zap, Euro, CheckCircle2 } from 'lucide-react'
import { listingsApi } from '@/api/listingsApi'
import { chatApi } from '@/api/chatApi'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import Layout from '@/components/Layout'
import Loader from '@/components/Loader'
import EmptyState from '@/components/EmptyState'
import PhotoCarousel from '@/components/PhotoCarousel'
import { lazy, Suspense } from 'react'
import { toast } from 'sonner'

const MiniMap = lazy(() => import('@/components/MiniMap'))

const AMENITY_LABELS: Record<string, string> = {
  pool: 'Piscine',
  elevator: 'Ascenseur',
  parking: 'Parking',
  terrace: 'Terrasse',
  cellar: 'Cave',
  balcony: 'Balcon',
  concierge: 'Gardien',
  digicode: 'Digicode',
  petsAllowed: 'Animaux acceptés',
  furnished: 'Meublé',
  internet: 'Internet inclus',
  airConditioning: 'Climatisation',
}

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop'

function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const openConversation = useChatStore((s) => s.openConversation)

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id!),
    enabled: !!id,
  })

  const startChat = useMutation({
    mutationFn: () =>
      chatApi.startConversation({
        listingId: listing!.id,
        listingTitle: listing!.title,
        ownerId: listing!.ownerId,
        ownerName: listing!.ownerName ?? 'Propriétaire',
      }),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] })
      openConversation(conv.id)
    },
    onError: () => toast.error('Impossible d\'ouvrir la conversation.'),
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Loader />
        </div>
      </Layout>
    )
  }

  if (error || !listing) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <EmptyState
            icon={Home}
            title="Annonce introuvable"
            description="Cette annonce n'existe plus ou a été retirée par son propriétaire."
            actionLabel="Retour à l'accueil"
            actionTo="/"
          />
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
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Photo carousel */}
          <div className="relative h-72 sm:h-[420px]">
            <PhotoCarousel photos={photos} alt={listing.title} className="h-full" />
            <span className="absolute top-3 left-3 z-10 bg-indigo-600 text-white text-sm font-medium px-3 py-1 rounded-full shadow">
              {listing.propertyType}
            </span>
            {isOwner && listing.locked && (
              <span className="absolute top-3 right-14 z-10 flex items-center gap-1 bg-amber-500 text-white text-sm font-medium px-3 py-1 rounded-full shadow">
                <Lock className="h-4 w-4" />
                Non modifiable
              </span>
            )}
          </div>

          <div className="p-6 sm:flex sm:gap-8">
            {/* Left: info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{listing.title}</h1>

              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                {listing.city}
              </div>

              {listing.ownerName && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                  <User className="h-4 w-4" />
                  Proposé par <strong className="ml-1">{listing.ownerName}</strong>
                </div>
              )}

              <div className="flex items-center gap-1 text-sm text-gray-400 mb-5">
                <Calendar className="h-3.5 w-3.5" />
                Publié le {new Date(listing.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Surface</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Maximize2 className="h-4 w-4 text-indigo-400" />
                    {listing.surface} m²
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">Chambres</span>
                  <span className="font-semibold flex items-center gap-1">
                    <BedDouble className="h-4 w-4 text-indigo-400" />
                    {listing.rooms} chambre{listing.rooms > 1 ? 's' : ''}
                  </span>
                </div>
                {listing.floor != null && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400">Étage</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Layers className="h-4 w-4 text-indigo-400" />
                      {listing.floor === 0 ? 'RDC' : `${listing.floor}e étage`}
                    </span>
                  </div>
                )}
                {listing.energyClass && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400">Classe énergie</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Zap className="h-4 w-4 text-indigo-400" />
                      DPE {listing.energyClass}
                    </span>
                  </div>
                )}
                {listing.deposit != null && listing.deposit > 0 && (
                  <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400">Dépôt de garantie</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Euro className="h-4 w-4 text-indigo-400" />
                      {listing.deposit.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: price + CTA */}
            <div className="sm:text-right mt-4 sm:mt-0 sm:min-w-[180px]">
              <p className="text-3xl font-bold text-indigo-600 mb-0.5">
                {listing.price.toLocaleString('fr-FR')}€
              </p>
              <p className="text-sm text-gray-400 mb-4">/mois charges comprises</p>

              {isOwner ? (
                listing.locked ? (
                  <span
                    className="inline-flex items-center gap-1 bg-gray-200 text-gray-500 text-sm font-medium px-5 py-2.5 rounded-xl cursor-not-allowed"
                    title="Cette annonce a une candidature en cours et ne peut pas être modifiée"
                  >
                    <Lock className="h-4 w-4" />
                    Non modifiable
                  </span>
                ) : (
                  <Link
                    to={`/listings/${listing.id}/edit`}
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Modifier cette annonce
                  </Link>
                )
              ) : isAuthenticated ? (
                <div className="flex flex-col gap-2 items-end">
                  <Link
                    to={`/listings/${listing.id}/apply`}
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors shadow-sm hover:shadow-md"
                  >
                    Postuler en ligne →
                  </Link>
                  <button
                    onClick={() => startChat.mutate()}
                    disabled={startChat.isPending}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contacter le propriétaire
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                >
                  Connectez-vous pour postuler
                </Link>
              )}
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-5">
              <h2 className="font-semibold mb-3">À propos du logement</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-5">
              <h2 className="font-semibold mb-3">Équipements & services</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-100"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {AMENITY_LABELS[amenity] ?? amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mini-map */}
          <div className="px-6 pb-6 border-t border-gray-100 pt-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-500" />
              Localisation — {listing.city}
            </h2>
            <Suspense
              fallback={
                <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                  <span className="text-sm text-gray-400">Chargement de la carte…</span>
                </div>
              }
            >
              <MiniMap city={listing.city} />
            </Suspense>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ListingDetailPage
