import { create } from 'zustand'
import type { Note, CreateNotePayload, UpdateNotePayload } from '../../../shared/types'

interface NoteStore {
  notes: Note[]
  isLoading: boolean
  loadNotes: () => Promise<void>
  createNote: (payload?: CreateNotePayload) => Promise<Note>
  updateNote: (id: string, payload: UpdateNotePayload) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  openNoteWindow: (noteId: string) => Promise<void>
  // Called from IPC events pushed by main process
  _addNote: (note: Note) => void
  _removeNote: (id: string) => void
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: [],
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true })
    const notes = await window.api.note.getAll()
    set({ notes, isLoading: false })
  },

  createNote: async (payload) => {
    const note = await window.api.note.create(payload)
    set((s) => ({ notes: [note, ...s.notes] }))
    return note
  },

  updateNote: async (id, payload) => {
    const updated = await window.api.note.update(id, payload)
    if (!updated) return
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? updated : n)),
    }))
  },

  deleteNote: async (id) => {
    await window.api.note.delete(id)
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
  },

  openNoteWindow: async (noteId) => {
    await window.api.note.openWindow(noteId)
  },

  _addNote: (note) =>
    set((s) => ({
      notes: s.notes.some((n) => n.id === note.id) ? s.notes : [note, ...s.notes],
    })),

  _removeNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}))
