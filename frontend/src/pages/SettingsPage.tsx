import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation } from '@tanstack/react-query'
import { User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/Layout'
import Loader from '@/components/Loader'

const schema = z.object({
  fullName: z.string().min(2, 'Nom complet requis (2 caractères minimum)'),
  email: z.string().email('Email invalide'),
})

type FormData = z.infer<typeof schema>

function SettingsPage() {
  const setUser = useAuthStore((s) => s.setUser)

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (me) reset({ fullName: me.fullName, email: me.email })
  }, [me, reset])

  const mutation = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (updated) => {
      setUser(updated)
      reset({ fullName: updated.fullName, email: updated.email })
      toast.success('Profil mis à jour.')
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('email', { message: 'Cet email est déjà utilisé.' })
        return
      }
      toast.error('Impossible de mettre à jour le profil.')
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-xl mb-4">
              <UserIcon className="h-7 w-7 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold">Mon profil</h1>
            <p className="text-sm text-gray-500 text-center mt-1">
              Mettez à jour vos informations personnelles.
            </p>
          </div>

          {isLoading ? (
            <Loader />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet</label>
                <input
                  {...register('fullName')}
                  type="text"
                  placeholder="Jean Dupont"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="jean@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
              >
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SettingsPage
