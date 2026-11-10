import { create } from 'zustand'
import type { Folder } from '../../../shared/types'

interface FolderStore {
  folders: Folder[]
  selectedFolderId: string | null
  load: () => Promise<void>
  createFolder: (name: string) => Promise<Folder>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  selectFolder: (id: string | null) => void
  reorderFolders: (draggedId: string, targetId: string) => Promise<void>
}

export const useFolderStore = create<FolderStore>((set, get) => ({
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

  reorderFolders: async (draggedId, targetId) => {
    if (draggedId === targetId) return
    const { folders } = get()
    const without = folders.filter((f) => f.id !== draggedId)
    const targetIdx = without.findIndex((f) => f.id === targetId)
    if (targetIdx === -1) return
    const dragged = folders.find((f) => f.id === draggedId)!
    const newOrder = [
      ...without.slice(0, targetIdx),
      dragged,
      ...without.slice(targetIdx),
    ].map((f, i) => ({ ...f, sortOrder: i }))

    set({ folders: newOrder })
    for (const f of newOrder) {
      await window.api.folder.update(f.id, { sortOrder: f.sortOrder })
    }
  },
}))
