import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Home } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { listingsApi } from '@/api/listingsApi'
import { applicationsApi } from '@/api/applicationsApi'
import Layout from '@/components/Layout'
import Loader from '@/components/Loader'
import EmptyState from '@/components/EmptyState'

const EMPLOYMENT_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'STUDENT', label: 'Étudiant' },
  { value: 'OTHER', label: 'Autre' },
]

const schema = z.object({
  monthlyIncome: z
    .string()
    .min(1, 'Revenu mensuel requis')
    .regex(/^\d+$/, 'Doit être un nombre entier'),
  employmentStatus: z.string().min(1, "Statut d'emploi requis"),
  message: z.string().max(2000).optional(),
})

type FormData = z.infer<typeof schema>

function ApplyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id!),
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    reset({ monthlyIncome: '', employmentStatus: '', message: '' })
  }, [id, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      applicationsApi.create({
        listingId: id!,
        monthlyIncome: parseInt(data.monthlyIncome, 10),
        employmentStatus: data.employmentStatus,
        message: data.message || undefined,
      }),
    onSuccess: () => {
      toast.success('Candidature envoyée.')
      navigate('/my-applications')
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? err.response?.data?.error ?? 'Erreur inconnue')
        : 'Erreur inconnue'
      setError('root', { message: msg })
      toast.error(msg)
    },
  })

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-8">
          <Loader />
        </div>
      </Layout>
    )
  }

  if (!listing) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-8">
          <EmptyState
            icon={Home}
            title="Annonce introuvable"
            description="Cette annonce n'est plus disponible."
            actionLabel="Retour à l'accueil"
            actionTo="/"
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold mb-1">Postuler pour</h1>
          <p className="text-sm text-gray-500 mb-6">
            <strong>{listing.title}</strong> — {listing.city} · {listing.price}€/mois
          </p>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Revenu mensuel net (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                {...register('monthlyIncome')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="2500"
              />
              {errors.monthlyIncome && (
                <p className="text-xs text-red-500 mt-1">{errors.monthlyIncome.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Situation professionnelle <span className="text-red-500">*</span>
              </label>
              <select
                {...register('employmentStatus')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue=""
              >
                <option value="" disabled>
                  Sélectionnez…
                </option>
                {EMPLOYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {errors.employmentStatus && (
                <p className="text-xs text-red-500 mt-1">{errors.employmentStatus.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Message au propriétaire</label>
              <textarea
                rows={5}
                {...register('message')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Présentez-vous en quelques mots…"
              />
              {errors.message && (
                <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
              )}
            </div>

            {errors.root && (
              <p className="text-sm text-red-500">{errors.root.message}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {mutation.isPending ? 'Envoi…' : 'Envoyer la candidature'}
              </Button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default ApplyPage
