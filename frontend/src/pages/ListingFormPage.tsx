import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Home, Pencil, Camera, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { listingsApi } from '@/api/listingsApi'
import Layout from '@/components/Layout'
import Loader from '@/components/Loader'

const AMENITY_OPTIONS = [
  { key: 'furnished',      label: 'Meublé' },
  { key: 'parking',        label: 'Parking' },
  { key: 'elevator',       label: 'Ascenseur' },
  { key: 'balcony',        label: 'Balcon' },
  { key: 'terrace',        label: 'Terrasse' },
  { key: 'cellar',         label: 'Cave' },
  { key: 'pool',           label: 'Piscine' },
  { key: 'internet',       label: 'Internet inclus' },
  { key: 'airConditioning',label: 'Climatisation' },
  { key: 'petsAllowed',    label: 'Animaux acceptés' },
  { key: 'concierge',      label: 'Gardien' },
  { key: 'digicode',       label: 'Digicode' },
]

const schema = z.object({
  title: z.string().min(1, "Titre requis").max(255),
  propertyType: z.string().min(1, "Type de bien requis"),
  city: z.string().min(1, "Ville requise").max(100),
  price: z.string().min(1, "Loyer requis"),
  surface: z.string().min(1, "Surface requise"),
  rooms: z.string().min(1, "Chambres requis"),
  description: z.string().optional(),
  floor: z.string().optional(),
  energyClass: z.string().optional(),
  deposit: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function ListingFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getById(id!),
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        propertyType: existing.propertyType,
        city: existing.city,
        price: String(existing.price),
        surface: String(existing.surface),
        rooms: String(existing.rooms),
        description: existing.description || '',
        floor: existing.floor != null ? String(existing.floor) : '',
        energyClass: existing.energyClass || '',
        deposit: existing.deposit != null ? String(existing.deposit) : '',
      })
      setPhotoUrls(existing.photoUrls || [])
      setAmenities(existing.amenities || [])
    }
  }, [existing, reset])

  const toggleAmenity = (key: string) => {
    setAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    )
  }

  const toPayload = (data: FormData) => ({
    title: data.title,
    propertyType: data.propertyType,
    city: data.city,
    price: Number(data.price),
    surface: Number(data.surface),
    rooms: Number(data.rooms),
    description: data.description,
    photoUrls,
    amenities,
    floor: data.floor ? Number(data.floor) : null,
    energyClass: data.energyClass || null,
    deposit: data.deposit ? Number(data.deposit) : null,
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      listingsApi.create(toPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      toast.success('Annonce publiée.')
      navigate('/my-listings')
    },
    onError: () => {
      const msg = 'Une erreur est survenue.'
      setError('root', { message: msg })
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      listingsApi.update(id!, toPayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      queryClient.invalidateQueries({ queryKey: ['listing', id] })
      toast.success('Annonce mise à jour.')
      navigate(`/listings/${id}`)
    },
    onError: (err: unknown) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const msg =
        status === 409
          ? 'Cette annonce a des candidatures en cours et ne peut pas être modifiée.'
          : 'Une erreur est survenue.'
      setError('root', { message: msg })
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => listingsApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      toast.success('Annonce supprimée.')
      navigate('/my-listings')
    },
    onError: (err: unknown) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const msg =
        status === 409
          ? 'Cette annonce a des candidatures en cours et ne peut pas être supprimée.'
          : 'Erreur lors de la suppression.'
      setError('root', { message: msg })
      toast.error(msg)
    },
  })

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const addPhoto = () => {
    if (newPhotoUrl.trim()) {
      setPhotoUrls([...photoUrls, newPhotoUrl.trim()])
      setNewPhotoUrl('')
    }
  }

  const removePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index))
  }

  if (isEdit && loadingExisting) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Loader />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 rounded-xl ${isEdit ? 'bg-amber-100' : 'bg-indigo-100'}`}>
              {isEdit ? (
                <Pencil className="h-5 w-5 text-amber-600" />
              ) : (
                <Home className="h-5 w-5 text-indigo-600" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {isEdit ? "Modifier l'annonce" : 'Publier une annonce'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEdit
                  ? 'Mettez à jour les informations de votre bien immobilier.'
                  : 'Détaillez votre bien pour attirer les meilleurs locataires.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">Titre de l'annonce</label>
              <input
                {...register('title')}
                placeholder="Ex: Superbe T2 en centre-ville"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Type + City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Type de bien</label>
                <select
                  {...register('propertyType')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">Sélectionner</option>
                  <option value="Appartement">Appartement</option>
                  <option value="Maison">Maison</option>
                  <option value="Loft">Loft</option>
                  <option value="Studio">Studio</option>
                </select>
                {errors.propertyType && (
                  <p className="text-xs text-red-500 mt-1">{errors.propertyType.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lieu / Ville</label>
                <input
                  {...register('city')}
                  placeholder="Ex: Lyon, France"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {errors.city && (
                  <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                )}
              </div>
            </div>

            {/* Price + Surface + Rooms */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Loyer mensuel (Charges comprises)</label>
                <input
                  {...register('price')}
                  type="number"
                  placeholder="Ex: 850"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {errors.price && (
                  <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Surface (m²)</label>
                <input
                  {...register('surface')}
                  type="number"
                  placeholder="45"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {errors.surface && (
                  <p className="text-xs text-red-500 mt-1">{errors.surface.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chambres</label>
                <input
                  {...register('rooms')}
                  type="number"
                  placeholder="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {errors.rooms && (
                  <p className="text-xs text-red-500 mt-1">{errors.rooms.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Décrivez les atouts de votre logement..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            {/* Floor + Energy class + Deposit */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Étage</label>
                <input
                  {...register('floor')}
                  type="number"
                  min={0}
                  placeholder="0 = RDC"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Classe énergie (DPE)</label>
                <select
                  {...register('energyClass')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                >
                  <option value="">Non renseignée</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dépôt de garantie (€)</label>
                <input
                  {...register('deposit')}
                  type="number"
                  min={0}
                  placeholder="Ex: 1700"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label className="block text-sm font-medium mb-2">Équipements & services</label>
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleAmenity(key)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      amenities.includes(key)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos (simulated URLs) */}
            <div>
              <label className="block text-sm font-medium mb-1">
                {isEdit ? 'Gérer les photos' : 'Ajouter des photos'}
              </label>
              <p className="text-xs text-gray-400 mb-2">JPG, PNG, max 5MB (simulation)</p>

              {photoUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="h-16 w-16 rounded object-cover border"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=64&h=64&fit=crop'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="URL de l'image..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={addPhoto}
                  className="border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Camera className="h-4 w-4" />
                  Ajouter
                </button>
              </div>
            </div>

            {errors.root && (
              <p className="text-xs text-red-500 text-center">{errors.root.message}</p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className={`w-full text-white ${
                isEdit
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isEdit
                ? updateMutation.isPending
                  ? 'Enregistrement...'
                  : 'Enregistrer les modifications'
                : createMutation.isPending
                  ? 'Publication...'
                  : "Publier l'annonce"}
            </Button>

            {isEdit && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
                    deleteMutation.mutate()
                  }
                }}
                className="w-full text-red-500 hover:text-red-700 text-sm font-medium flex items-center justify-center gap-1 py-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer l'annonce
              </button>
            )}
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default ListingFormPage
