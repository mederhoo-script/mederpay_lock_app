import { create } from 'zustand'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'superadmin' | 'agent' | 'subagent'
  status: 'active' | 'pending' | 'suspended'
  parent_agent_id?: string
}

interface AppStore {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
