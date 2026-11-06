import { create } from 'zustand'
import type { Note, CreateNotePayload, UpdateNotePayload } from '../../../shared/types'

interface NoteStore {
  notes: Note[]
  isLoading: boolean
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  loadNotes: () => Promise<void>
  createNote: (payload?: CreateNotePayload) => Promise<Note>
  updateNote: (id: string, payload: UpdateNotePayload) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  openNoteWindow: (noteId: string) => Promise<void>
  _addNote: (note: Note) => void
  _removeNote: (id: string) => void
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  isLoading: false,
  selectedId: null,

  setSelectedId: (id) => set({ selectedId: id }),

  loadNotes: async () => {
    set({ isLoading: true })
    const notes = await window.api.note.getAll()
    set({ notes, isLoading: false, selectedId: notes[0]?.id ?? null })
  },

  createNote: async (payload) => {
    const note = await window.api.note.create(payload)
    set((s) => ({ notes: [note, ...s.notes], selectedId: note.id }))
    return note
  },

  updateNote: async (id, payload) => {
    // 즉시 UI에 반영 (optimistic update)
    set((s) => ({
      notes: s.notes.map((n) =>
        n.id === id ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n
      ),
    }))
    // DB 동기화
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
      return { notes, selectedId }
    })
  },

  openNoteWindow: async (noteId) => {
    await window.api.note.openWindow(noteId)
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
}))
