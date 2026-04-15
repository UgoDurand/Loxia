import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Clock, Check, X, Mail } from 'lucide-react'
import { applicationsApi, type Application, type ApplicationStatus } from '@/api/applicationsApi'
import Layout from '@/components/Layout'

const STATUS_STYLES: Record<ApplicationStatus, { label: string; classes: string }> = {
  PENDING: { label: 'En attente', classes: 'bg-amber-100 text-amber-800' },
  ACCEPTED: { label: 'Acceptée', classes: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Refusée', classes: 'bg-red-100 text-red-800' },
}

function ReceivedApplicationsPage() {
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['received-applications'],
    queryFn: applicationsApi.getReceived,
  })

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Candidatures reçues</h1>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Chargement...</p>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-500">
              Vous n'avez pas encore reçu de candidature sur vos annonces.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <ReceivedApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function ReceivedApplicationCard({ application }: { application: Application }) {
  const queryClient = useQueryClient()
  const style = STATUS_STYLES[application.status]
  const date = new Date(application.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['received-applications'] })
    queryClient.invalidateQueries({ queryKey: ['listing', application.listingId] })
    queryClient.invalidateQueries({ queryKey: ['my-listings'] })
  }

  const acceptMutation = useMutation({
    mutationFn: () => applicationsApi.accept(application.id),
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: () => applicationsApi.reject(application.id),
    onSuccess: invalidate,
  })

  const isPending = application.status === 'PENDING'
  const busy = acceptMutation.isPending || rejectMutation.isPending

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold">
            {application.applicantFullName || 'Candidat inconnu'}
          </p>
          {application.applicantEmail && (
            <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Mail className="h-3 w-3" />
              {application.applicantEmail}
            </p>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${style.classes}`}
        >
          {style.label}
        </span>
      </div>

      <Link
        to={`/listings/${application.listingId}`}
        className="block text-sm text-gray-600 hover:text-indigo-600 transition-colors mb-3"
      >
        <span className="font-medium">{application.listingTitle || 'Annonce supprimée'}</span>
        {application.listingCity && (
          <span className="text-xs text-gray-500 inline-flex items-center gap-1 ml-2">
            <MapPin className="h-3 w-3" />
            {application.listingCity}
          </span>
        )}
      </Link>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {date}
        </span>
        <span>Revenu : {application.monthlyIncome}€</span>
        <span>Statut : {application.employmentStatus}</span>
      </div>

      {application.message && (
        <p className="text-sm text-gray-600 border-t border-gray-100 pt-3 mt-3 whitespace-pre-line">
          {application.message}
        </p>
      )}

      {isPending && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => acceptMutation.mutate()}
            disabled={busy}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Check className="h-4 w-4" />
            Accepter
          </button>
          <button
            onClick={() => rejectMutation.mutate()}
            disabled={busy}
            className="flex items-center gap-1 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
            Refuser
          </button>
        </div>
      )}
    </div>
  )
}

export default ReceivedApplicationsPage
