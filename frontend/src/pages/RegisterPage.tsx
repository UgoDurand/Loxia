import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import PageTransition from '@/components/PageTransition'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  fullName: z.string().min(2, 'Nom complet requis (2 caractères minimum)'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
})

type FormData = z.infer<typeof schema>

function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const response = await authApi.register(data)
      setAuth(
        { accessToken: response.accessToken, refreshToken: response.refreshToken },
        response.user
      )
      navigate('/')
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 409) {
        setError('email', { message: 'Cet email est déjà utilisé.' })
      } else {
        setError('root', { message: 'Une erreur est survenue. Réessayez.' })
      }
    }
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-indigo-100 p-3 rounded-xl mb-4">
            <UserPlus className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Un compte unique pour louer et mettre en location.
          </p>
        </div>

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

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-xs text-red-500 text-center">{errors.root.message}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isSubmitting ? 'Création…' : "Créer mon compte"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
    </PageTransition>
  )
}

export default RegisterPage
