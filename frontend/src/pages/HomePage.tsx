import { Home, LogOut, User } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/authApi'

function HomePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, refreshToken, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // server-side revocation best-effort
      }
    }
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
      <div className="flex items-center gap-3">
        <Home className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Loxia</h1>
      </div>

      <p className="text-muted-foreground text-center max-w-md">
        Plateforme de location immobilière — trouvez votre prochain chez-vous.
      </p>

      {isAuthenticated && user ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>
              Connecté en tant que <strong>{user.fullName}</strong>
            </span>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link to="/login" className={cn(buttonVariants())}>
            Se connecter
          </Link>
          <Link to="/register" className={cn(buttonVariants({ variant: 'outline' }))}>
            S'inscrire
          </Link>
        </div>
      )}
    </div>
  )
}

export default HomePage
