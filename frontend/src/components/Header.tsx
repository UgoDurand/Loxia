import { Link, useNavigate } from 'react-router-dom'
import { Home, Search, Building2, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { useRoleStore } from '@/store/roleStore'
import { authApi } from '@/api/authApi'
import { cn } from '@/lib/utils'

function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, refreshToken, clearAuth } = useAuthStore()
  const { role, setRole } = useRoleStore()

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // best-effort
      }
    }
    clearAuth()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Home className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg">Loxia</span>
        </Link>

        {/* Toggle Locataire / Propriétaire */}
        <div className="flex items-center bg-gray-100 rounded-full p-0.5">
          <button
            onClick={() => { setRole('tenant'); navigate('/') }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              role === 'tenant'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Search className="h-3.5 w-3.5" />
            Locataire
          </button>
          <button
            onClick={() => { setRole('owner'); navigate('/') }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              role === 'owner'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            Propriétaire
          </button>
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-full px-3 py-1.5"
              >
                <User className="h-3.5 w-3.5" />
                Mon Profil
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
