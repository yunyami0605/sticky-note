import { create } from 'zustand'
import type { CustomEmoji } from '../../../shared/types'

interface CustomEmojiState {
  emojis: CustomEmoji[]
  load: () => Promise<void>
  add: (name: string, filePath: string) => Promise<CustomEmoji>
  remove: (id: string) => Promise<void>
}

export const useCustomEmojiStore = create<CustomEmojiState>((set) => ({
  emojis: [],

  load: async () => {
    const emojis = await window.api.customEmoji.getAll()
    set({ emojis })
  },

  add: async (name: string, filePath: string) => {
    const emoji = await window.api.customEmoji.add({ name, filePath })
    set(state => ({ emojis: [...state.emojis, emoji] }))
    return emoji
  },

  remove: async (id: string) => {
    await window.api.customEmoji.delete(id)
    set(state => ({ emojis: state.emojis.filter(e => e.id !== id) }))
  },
}))
