import { create } from 'zustand'
import type { Folder } from '../../../shared/types'

interface FolderStore {
  folders: Folder[]
  selectedFolderId: string | null
  load: () => Promise<void>
  createFolder: (name: string) => Promise<Folder>
  renameFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  duplicateFolder: (id: string) => Promise<Folder | null>
  nestFolder: (id: string, parentId: string | null) => Promise<void>
  selectFolder: (id: string | null) => void
  reorderFolders: (draggedId: string, targetId: string) => Promise<void>
  moveFolder: (id: string, direction: 'up' | 'down') => Promise<void>
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

  duplicateFolder: async (id) => {
    const folder = await window.api.folder.duplicate(id)
    if (folder) {
      set((s) => ({ folders: [...s.folders, folder] }))
    }
    return folder
  },

  nestFolder: async (id, parentId) => {
    // Prevent circular nesting: check if parentId is a descendant of id
    const { folders } = get()
    const isDescendant = (checkId: string): boolean => {
      const children = folders.filter((f) => f.parentId === checkId)
      return children.some((c) => c.id === parentId || isDescendant(c.id))
    }
    if (parentId && (parentId === id || isDescendant(id))) return
    await window.api.folder.update(id, { parentId })
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? { ...f, parentId } : f)),
    }))
  },

  reorderFolders: async (draggedId, targetId) => {
    if (draggedId === targetId) return
    const { folders } = get()
    const dragged = folders.find((f) => f.id === draggedId)
    const target = folders.find((f) => f.id === targetId)
    if (!dragged || !target) return
    // Reorder siblings within the same parent
    const parentId = target.parentId
    const siblings = folders.filter((f) => f.parentId === parentId)
    const withoutDragged = siblings.filter((f) => f.id !== draggedId)
    const targetIdx = withoutDragged.findIndex((f) => f.id === targetId)
    if (targetIdx === -1) return
    const newOrder = [
      ...withoutDragged.slice(0, targetIdx),
      { ...dragged, parentId },
      ...withoutDragged.slice(targetIdx),
    ].map((f, i) => ({ ...f, sortOrder: i }))

    set((s) => ({
      folders: s.folders.map((f) => {
        const updated = newOrder.find((n) => n.id === f.id)
        return updated ?? f
      }),
    }))
    for (const f of newOrder) {
      await window.api.folder.update(f.id, { sortOrder: f.sortOrder, parentId: f.parentId })
    }
  },

  moveFolder: async (id, direction) => {
    const { folders } = get()
    const folder = folders.find((f) => f.id === id)
    if (!folder) return
    const siblings = folders.filter((f) => f.parentId === folder.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = siblings.findIndex((f) => f.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= siblings.length) return
    const newOrder = [...siblings]
    const tmp = newOrder[idx]
    newOrder[idx] = { ...newOrder[swapIdx], sortOrder: tmp.sortOrder }
    newOrder[swapIdx] = { ...tmp, sortOrder: newOrder[swapIdx].sortOrder }
    set((s) => ({
      folders: s.folders.map((f) => {
        const updated = newOrder.find((n) => n.id === f.id)
        return updated ?? f
      }),
    }))
    await window.api.folder.update(newOrder[idx].id, { sortOrder: newOrder[idx].sortOrder })
    await window.api.folder.update(newOrder[swapIdx].id, { sortOrder: newOrder[swapIdx].sortOrder })
  },
}))
