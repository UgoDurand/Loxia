import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Settings, FileText, Inbox, LogOut, User as UserIcon } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/authApi'
import { cn } from '@/lib/utils'

function ProfileLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, refreshToken, clearAuth } = useAuthStore()

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch {
        // best-effort
      }
    }
    clearAuth()
    queryClient.clear()
    navigate('/login')
  }

  const navItemClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    )

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-20">
            {/* Avatar + name */}
            <div className="flex flex-col items-center pb-4 mb-4 border-b border-gray-100">
              <div className="bg-indigo-100 p-3 rounded-full mb-2">
                <UserIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="font-semibold text-sm text-center">
                {user?.fullName ?? 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-400">Compte unifié</p>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                Mon espace
              </p>
              <NavLink to="/profile" end className={navItemClasses}>
                <Settings className="h-4 w-4" />
                Paramètres du compte
              </NavLink>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mt-3 mb-1">
                Côté locataire
              </p>
              <NavLink to="/profile/applications" className={navItemClasses}>
                <FileText className="h-4 w-4" />
                Mes candidatures
              </NavLink>

              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mt-3 mb-1">
                Côté propriétaire
              </p>
              <NavLink to="/profile/received" className={navItemClasses}>
                <Inbox className="h-4 w-4" />
                Demandes reçues
              </NavLink>
            </nav>

            <div className="pt-4 mt-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1 min-w-0">
          <Outlet />
        </section>
      </div>
    </Layout>
  )
}

export default ProfileLayout
