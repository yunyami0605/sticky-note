import { create } from 'zustand'
import type { Tag } from '../../../shared/types'

interface TagStore {
  tags: Tag[]
  noteTagMap: Record<string, string[]>  // noteId → tagId[]
  selectedTagId: string | null
  load: () => Promise<void>
  createTag: (name: string, color: string) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
  selectTag: (id: string | null) => void
  loadNoteTagIds: (noteId: string) => Promise<void>
  toggleNoteTag: (noteId: string, tagId: string) => Promise<void>
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  noteTagMap: {},
  selectedTagId: null,

  selectTag: (id) => set({ selectedTagId: id }),

  load: async () => {
    const tags = await window.api.tag.getAll()
    set({ tags })
  },

  createTag: async (name, color) => {
    const tag = await window.api.tag.create({ name, color })
    set((s) => ({ tags: [...s.tags, tag] }))
    return tag
  },

  deleteTag: async (id) => {
    await window.api.tag.delete(id)
    set((s) => {
      const noteTagMap = { ...s.noteTagMap }
      for (const noteId of Object.keys(noteTagMap)) {
        noteTagMap[noteId] = noteTagMap[noteId].filter((t) => t !== id)
      }
      return {
        tags: s.tags.filter((t) => t.id !== id),
        selectedTagId: s.selectedTagId === id ? null : s.selectedTagId,
        noteTagMap,
      }
    })
  },

  loadNoteTagIds: async (noteId) => {
    const tagIds = await window.api.tag.getForNote(noteId)
    set((s) => ({ noteTagMap: { ...s.noteTagMap, [noteId]: tagIds } }))
  },

  toggleNoteTag: async (noteId, tagId) => {
    const current = get().noteTagMap[noteId] ?? []
    if (current.includes(tagId)) {
      await window.api.tag.removeFromNote(noteId, tagId)
      set((s) => ({
        noteTagMap: { ...s.noteTagMap, [noteId]: (s.noteTagMap[noteId] ?? []).filter((t) => t !== tagId) },
      }))
    } else {
      await window.api.tag.setForNote(noteId, tagId)
      set((s) => ({
        noteTagMap: { ...s.noteTagMap, [noteId]: [...(s.noteTagMap[noteId] ?? []), tagId] },
      }))
    }
  },
}))
