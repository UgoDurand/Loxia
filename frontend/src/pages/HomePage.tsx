import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Home, Plus, Building2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { listingsApi } from '@/api/listingsApi'
import { useAuthStore } from '@/store/authStore'
import { useRoleStore } from '@/store/roleStore'
import Layout from '@/components/Layout'
import ListingCard from '@/components/ListingCard'
import Loader from '@/components/Loader'
import EmptyState from '@/components/EmptyState'

function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const { role } = useRoleStore()

  const [city, setCity] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', city, propertyType, maxPrice],
    queryFn: () =>
      listingsApi.search({
        city: city || undefined,
        propertyType: propertyType || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Query is already reactive via queryKey
  }

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

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ville, quartier..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="">Tous les types</option>
              <option value="Appartement">Appartement</option>
              <option value="Maison">Maison</option>
              <option value="Loft">Loft</option>
              <option value="Studio">Studio</option>
            </select>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              type="number"
              placeholder="Prix max"
              className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
            >
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Listings grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">
          {city || propertyType || maxPrice ? 'Résultats' : 'Annonces récentes'}
        </h2>

        {isLoading ? (
          <Loader />
        ) : listings.length === 0 ? (
          <EmptyState
            icon={Search}
            title="Aucune annonce trouvée"
            description="Essayez d'ajuster vos filtres de recherche pour découvrir plus d'offres."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} showActions />
      ))}
    </div>
  )
}

export default HomePage
