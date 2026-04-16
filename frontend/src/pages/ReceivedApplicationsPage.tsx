import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Clock, Check, X, Mail, Inbox } from 'lucide-react'
import { toast } from 'sonner'
import { applicationsApi, type Application, type ApplicationStatus } from '@/api/applicationsApi'
import Loader from '@/components/Loader'
import EmptyState from '@/components/EmptyState'

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
    <div>
      <h1 className="text-xl font-bold mb-6">Candidatures reçues</h1>

      {isLoading ? (
        <Loader />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Aucune candidature reçue"
          description="Vos annonces n'ont pas encore attiré de candidats. Revenez un peu plus tard."
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ReceivedApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
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
    onSuccess: () => {
      invalidate()
      toast.success('Candidature acceptée.')
    },
    onError: () => toast.error("Impossible d'accepter la candidature."),
  })

  const rejectMutation = useMutation({
    mutationFn: () => applicationsApi.reject(application.id),
    onSuccess: () => {
      invalidate()
      toast.success('Candidature refusée.')
    },
    onError: () => toast.error('Impossible de refuser la candidature.'),
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

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {date}
        </span>
        <span>Revenu : {application.monthlyIncome}€</span>
        <span>{application.employmentStatus}</span>
        {application.startDate && (
          <span className="font-medium text-gray-600">
            Entrée : {new Date(application.startDate).toLocaleDateString('fr-FR')}
            {application.endDate && ` → ${new Date(application.endDate).toLocaleDateString('fr-FR')}`}
          </span>
        )}
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
