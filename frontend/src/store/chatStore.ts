import { create } from 'zustand'

interface ChatStore {
  open: boolean
  activeConvId: string | null
  openConversation: (convId: string) => void
  setOpen: (open: boolean) => void
  setActiveConvId: (id: string | null) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  open: false,
  activeConvId: null,
  openConversation: (convId) => set({ open: true, activeConvId: convId }),
  setOpen: (open) => set({ open }),
  setActiveConvId: (id) => set({ activeConvId: id }),
}))
