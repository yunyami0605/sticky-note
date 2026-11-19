import { create } from 'zustand'
import type { AppSettings, ThemeMode, ThemeColor, StartBehavior, ShortcutSettings } from '../../../shared/types'

export const isMac = typeof window !== 'undefined' && window.platform === 'darwin'

function defaultShortcuts(): ShortcutSettings {
  return {
    newNote:       { key: 'n',         meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    searchFocus:   { key: 'f',         meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    openSettings:  { key: ',',         meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    toggleSidebar: { key: '\\',        meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    deleteNote:    { key: 'backspace',  meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    duplicateNote: { key: 'd',         meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    openWindow:    { key: 'enter',     meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    prevNote:      { key: 'arrowup',   meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    nextNote:      { key: 'arrowdown', meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    toggleTheme:   { key: 'l',         meta: isMac,  ctrl: !isMac, shift: true,  alt: false },
  }
}

interface SettingsStore {
  themeMode: ThemeMode
  themeColor: ThemeColor
  startBehavior: StartBehavior
  spellCheck: boolean
  editorFontSize: number
  editorTextColor: string
  shortcuts: ShortcutSettings
  loaded: boolean
  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
  applyBroadcast: (settings: AppSettings) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  themeMode: 'dark',
  themeColor: 'navy',
  startBehavior: 'main',
  spellCheck: false,
  editorFontSize: 14,
  editorTextColor: '',
  shortcuts: defaultShortcuts(),
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

  applyBroadcast: (settings: AppSettings) => {
    set({ ...settings })
    applyTheme(settings.themeMode, settings.themeColor)
  },
}))

function applyTheme(mode: ThemeMode, color: ThemeColor): void {
  const root = document.documentElement
  root.setAttribute('data-theme-mode', mode)
  root.setAttribute('data-theme-color', color)
}
