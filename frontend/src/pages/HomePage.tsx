import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Home, Plus, Building2, LayoutGrid, Map, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { listingsApi } from '@/api/listingsApi'
import type { ListingSummary } from '@/api/listingsApi'
import { useAuthStore } from '@/store/authStore'
import { useRoleStore } from '@/store/roleStore'
import Layout from '@/components/Layout'
import ListingCard, { listingCardVariants } from '@/components/ListingCard'
import Loader from '@/components/Loader'
import EmptyState from '@/components/EmptyState'
import { ListingGridSkeleton } from '@/components/ListingCardSkeleton'
import { lazy, Suspense } from 'react'

const ListingsMap = lazy(() => import('@/components/ListingsMap'))

const gridContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

const PROPERTY_TYPES = ['Appartement', 'Maison', 'Loft', 'Studio']
const SORT_OPTIONS = [
  { value: 'default', label: 'Pertinence' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'surface_desc', label: 'Surface décroissante' },
]

function sortListings(listings: ListingSummary[], sort: string): ListingSummary[] {
  const copy = [...listings]
  switch (sort) {
    case 'price_asc': return copy.sort((a, b) => a.price - b.price)
    case 'price_desc': return copy.sort((a, b) => b.price - a.price)
    case 'surface_desc': return copy.sort((a, b) => b.surface - a.surface)
    default: return copy
  }
}

function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const { role } = useRoleStore()

  const [city, setCity] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableTo, setAvailableTo] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [sortBy, setSortBy] = useState('default')
  const [showFilters, setShowFilters] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const { data: allListings = [], isLoading } = useQuery({
    queryKey: ['listings', city, propertyType, maxPrice, minPrice, availableFrom, availableTo],
    queryFn: () =>
      listingsApi.search({
        city: city || undefined,
        propertyType: propertyType || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        availableFrom: availableFrom || undefined,
        availableTo: availableTo || undefined,
      }),
  })

  const listings = sortListings(allListings, sortBy)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  type FilterKey = 'city' | 'propertyType' | 'maxPrice' | 'minPrice' | 'availableFrom' | 'availableTo'

  const clearFilter = useCallback((filter: FilterKey) => {
    if (filter === 'city') setCity('')
    if (filter === 'propertyType') setPropertyType('')
    if (filter === 'maxPrice') setMaxPrice('')
    if (filter === 'minPrice') setMinPrice('')
    if (filter === 'availableFrom') setAvailableFrom('')
    if (filter === 'availableTo') setAvailableTo('')
  }, [])

  const activeFilters = [
    city && { key: 'city' as FilterKey, label: `Ville : ${city}` },
    propertyType && { key: 'propertyType' as FilterKey, label: propertyType },
    minPrice && { key: 'minPrice' as FilterKey, label: `Min : ${Number(minPrice).toLocaleString('fr-FR')}€` },
    maxPrice && { key: 'maxPrice' as FilterKey, label: `Max : ${Number(maxPrice).toLocaleString('fr-FR')}€` },
    availableFrom && { key: 'availableFrom' as FilterKey, label: `Dispo dès : ${new Date(availableFrom).toLocaleDateString('fr-FR')}` },
    availableTo && { key: 'availableTo' as FilterKey, label: `Dispo jusqu'au : ${new Date(availableTo).toLocaleDateString('fr-FR')}` },
  ].filter(Boolean) as { key: FilterKey; label: string }[]

  if (role === 'owner') {
    return (
      <Layout>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold mb-3">
              Gérez vos biens immobiliers
            </h1>
            <p className="text-gray-300 mb-6">
              Espace dédié aux propriétaires. Diffusez vos annonces et trouvez vos
              locataires via notre architecture de microservices.
            </p>
            {isAuthenticated ? (
              <div className="flex gap-3 justify-center">
                <Link
                  to="/my-listings"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Gérer mes annonces
                </Link>
                <Link
                  to="/listings/new"
                  className="bg-white text-gray-900 hover:bg-gray-100 px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle annonce
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Connectez-vous pour mettre en location
              </Link>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Vos annonces actives</h2>
          {!isAuthenticated ? (
            <EmptyState
              icon={Home}
              title="Espace sécurisé"
              description="Vous devez être connecté pour gérer vos annonces."
              actionLabel="Se connecter"
              actionTo="/login"
            />
          ) : (
            <OwnerListings />
          )}
        </div>
      </Layout>
    )
  }

  // Tenant view
  return (
    <Layout>
      {/* Hero + Search */}
      <div className="bg-white py-12 border-b">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">
            Trouvez votre prochain <span className="text-indigo-600">chez-vous</span>
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Recherchez et postulez en quelques clics grâce à notre architecture microservices
            rapide et fiable.
          </p>

          {/* Main search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto mb-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ville, quartier..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">Tous les types</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 mx-auto text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres avancés
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Advanced filters panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-200 max-w-2xl mx-auto text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prix minimum (€/mois)</label>
                      <input
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        type="number"
                        min={0}
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Prix maximum (€/mois)</label>
                      <input
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        type="number"
                        min={0}
                        placeholder="Illimité"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Disponible à partir du</label>
                      <input
                        type="date"
                        value={availableFrom}
                        min={today}
                        onChange={(e) => setAvailableFrom(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Disponible jusqu'au</label>
                      <input
                        type="date"
                        value={availableTo}
                        min={availableFrom || today}
                        onChange={(e) => setAvailableTo(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toolbar: count + active filters + sort + view toggle */}
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">
              {activeFilters.length > 0 ? 'Résultats' : 'Annonces récentes'}
              {!isLoading && listings.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({listings.length})
                </span>
              )}
            </h2>
            {/* Active filter chips */}
            {activeFilters.map(({ key, label }) => (
              <motion.span
                key={key}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {label}
                <button
                  onClick={() => clearFilter(key)}
                  className="hover:text-indigo-900 ml-0.5"
                  aria-label={`Retirer le filtre ${label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-600"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Grille
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Map className="h-4 w-4" />
                Carte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listings content */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        {isLoading ? (
          <ListingGridSkeleton count={6} />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune annonce trouvée"
            description="Essayez d'ajuster vos filtres de recherche pour découvrir plus d'offres."
          />
        ) : viewMode === 'map' ? (
          <div style={{ height: '600px' }}>
            <Suspense fallback={<Loader label="Chargement de la carte…" />}>
              <ListingsMap listings={listings} filterCity={city || undefined} />
            </Suspense>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {listings.map((listing) => (
              <motion.div key={listing.id} variants={listingCardVariants}>
                <ListingCard listing={listing} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  )
}

function OwnerListings() {
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: listingsApi.getMine,
  })

  if (isLoading) return <Loader />

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="Aucune annonce pour le moment"
        description="Créez votre première annonce et commencez à recevoir des candidatures."
        actionLabel="Ajouter un bien"
        actionTo="/listings/new"
      />
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 gap-5"
      variants={gridContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {listings.map((listing) => (
        <motion.div key={listing.id} variants={listingCardVariants}>
          <ListingCard listing={listing} showActions />
        </motion.div>
      ))}
    </motion.div>
  )
}

export default HomePage
