import { create } from 'zustand'
import type { AppSettings, ThemeMode, ThemeColor, StartBehavior } from '../../../shared/types'

interface SettingsStore {
  themeMode: ThemeMode
  themeColor: ThemeColor
  startBehavior: StartBehavior
  spellCheck: boolean
  loaded: boolean
  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  themeMode: 'dark',
  themeColor: 'navy',
  startBehavior: 'main',
  spellCheck: false,
  loaded: false,

  load: async () => {
    const settings = await window.api.settings.get()
    set({ ...settings, loaded: true })
    applyTheme(settings.themeMode, settings.themeColor)
  },

  update: async (partial) => {
    const updated = await window.api.settings.update(partial)
    set({ ...updated })
    applyTheme(updated.themeMode, updated.themeColor)
  },
}))

function applyTheme(mode: ThemeMode, color: ThemeColor): void {
  const root = document.documentElement
  root.setAttribute('data-theme-mode', mode)
  root.setAttribute('data-theme-color', color)
}
