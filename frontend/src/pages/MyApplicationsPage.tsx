import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Clock } from 'lucide-react'
import { applicationsApi, type Application, type ApplicationStatus } from '@/api/applicationsApi'
import Layout from '@/components/Layout'

const STATUS_STYLES: Record<ApplicationStatus, { label: string; classes: string }> = {
  PENDING: { label: 'En attente', classes: 'bg-amber-100 text-amber-800' },
  ACCEPTED: { label: 'Acceptée', classes: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Refusée', classes: 'bg-red-100 text-red-800' },
}

function MyApplicationsPage() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: applicationsApi.getMine,
  })

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Mes candidatures</h1>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Chargement...</p>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-3">Vous n'avez pas encore postulé à une annonce.</p>
            <Link
              to="/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block"
            >
              Parcourir les annonces
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <MyApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function MyApplicationCard({ application }: { application: Application }) {
  const style = STATUS_STYLES[application.status]
  const date = new Date(application.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Link
            to={`/listings/${application.listingId}`}
            className="font-semibold hover:text-indigo-600 transition-colors"
          >
            {application.listingTitle || 'Annonce supprimée'}
          </Link>
          {application.listingCity && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <MapPin className="h-3 w-3" />
              {application.listingCity}
              {application.listingPrice && (
                <>
                  <span className="mx-1">·</span>
                  {application.listingPrice}€/mois
                </>
              )}
            </div>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.classes}`}
        >
          {style.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Envoyée le {date}
        </span>
        <span>Revenu déclaré : {application.monthlyIncome}€</span>
        <span>Statut : {application.employmentStatus}</span>
      </div>

      {application.message && (
        <p className="text-sm text-gray-600 border-t border-gray-100 pt-3 mt-3 whitespace-pre-line">
          {application.message}
        </p>
      )}
    </div>
  )
}

export default MyApplicationsPage
