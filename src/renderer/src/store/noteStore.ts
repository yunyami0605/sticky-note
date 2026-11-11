import { create } from 'zustand'
import type { Note, CreateNotePayload, UpdateNotePayload } from '../../../shared/types'

interface NoteStore {
  notes: Note[]
  isLoading: boolean
  selectedId: string | null
  openWindowIds: Set<string>
  setSelectedId: (id: string | null) => void
  loadNotes: () => Promise<void>
  createNote: (payload?: CreateNotePayload) => Promise<Note>
  updateNote: (id: string, payload: UpdateNotePayload) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  duplicateNote: (noteId: string) => Promise<Note | null>
  reorderNotes: (updates: { id: string; sortOrder: number }[]) => Promise<void>
  openNoteWindow: (noteId: string) => Promise<void>
  toggleNoteWindow: (noteId: string) => Promise<void>
  setWindowOpen: (id: string, open: boolean) => void
  _addNote: (note: Note) => void
  _removeNote: (id: string) => void
  _syncNote: (note: Note) => void
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  isLoading: false,
  selectedId: null,
  openWindowIds: new Set(),

  setSelectedId: (id) => set({ selectedId: id }),

  setWindowOpen: (id, open) =>
    set((s) => {
      const next = new Set(s.openWindowIds)
      if (open) next.add(id)
      else next.delete(id)
      return { openWindowIds: next }
    }),

  loadNotes: async () => {
    set({ isLoading: true })
    const [notes, openIds] = await Promise.all([
      window.api.note.getAll(),
      window.api.note.getOpenWindows(),
    ])
    set({ notes, isLoading: false, selectedId: notes[0]?.id ?? null, openWindowIds: new Set(openIds) })
  },

  createNote: async (payload) => {
    const note = await window.api.note.create(payload)
    set((s) => ({ notes: [note, ...s.notes], selectedId: note.id }))
    return note
  },

  updateNote: async (id, payload) => {
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n
      ),
    }))
    const updated = await window.api.note.update(id, payload)
    if (!updated) return
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? updated : n)),
    }))
  },

  deleteNote: async (id) => {
    await window.api.note.delete(id)
    set((s) => {
      const notes = s.notes.filter((n) => n.id !== id)
      const selectedId = s.selectedId === id ? (notes[0]?.id ?? null) : s.selectedId
      const openWindowIds = new Set(s.openWindowIds)
      openWindowIds.delete(id)
      return { notes, selectedId, openWindowIds }
    })
  },

  duplicateNote: async (noteId) => {
    const note = await window.api.note.duplicate(noteId)
    return note
  },

  reorderNotes: async (updates) => {
    set((s) => ({
      notes: s.notes.map((n) => {
        const u = updates.find((u) => u.id === n.id)
        return u ? { ...n, sortOrder: u.sortOrder } : n
      }),
    }))
    await window.api.note.reorder(updates)
  },

  openNoteWindow: async (noteId) => {
    await window.api.note.openWindow(noteId)
  },

  toggleNoteWindow: async (noteId) => {
    await window.api.note.toggleWindow(noteId)
  },

  _addNote: (note) =>
    set((s) => ({
      notes: s.notes.some((n) => n.id === note.id) ? s.notes : [note, ...s.notes],
    })),

  _removeNote: (id) => {
    const { notes, selectedId } = get()
    const next = notes.filter((n) => n.id !== id)
    set({
      notes: next,
      selectedId: selectedId === id ? (next[0]?.id ?? null) : selectedId,
    })
  },

  _syncNote: (note) =>
    set((s) => ({ notes: s.notes.map((n) => (n.id === note.id ? note : n)) })),
}))
