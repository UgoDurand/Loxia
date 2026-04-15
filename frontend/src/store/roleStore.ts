import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Role = 'tenant' | 'owner'

interface RoleState {
  role: Role
  setRole: (role: Role) => void
  toggleRole: () => void
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      role: 'tenant' as Role,

      setRole: (role) => set({ role }),

      toggleRole: () =>
        set({ role: get().role === 'tenant' ? 'owner' : 'tenant' }),
    }),
    {
      name: 'loxia-role',
    }
  )
)
