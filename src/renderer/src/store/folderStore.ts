import { create } from 'zustand'
import type { Folder } from '../../../shared/types'

interface FolderStore {
  folders: Folder[]
  selectedFolderId: string | null  // null = 전체
  load: () => Promise<void>
  createFolder: (name: string) => Promise<Folder>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  selectFolder: (id: string | null) => void
}

export const useFolderStore = create<FolderStore>((set) => ({
  folders: [],
  selectedFolderId: null,

  selectFolder: (id) => set({ selectedFolderId: id }),

  load: async () => {
    const folders = await window.api.folder.getAll()
    set({ folders })
  },

  createFolder: async (name) => {
    const folder = await window.api.folder.create({ name })
    set((s) => ({ folders: [...s.folders, folder] }))
    return folder
  },

  renameFolder: async (id, name) => {
    await window.api.folder.update(id, { name })
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
    }))
  },

  deleteFolder: async (id) => {
    await window.api.folder.delete(id)
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== id),
      selectedFolderId: s.selectedFolderId === id ? null : s.selectedFolderId,
    }))
  },
}))
