export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'white'
export type FontSize = 'sm' | 'md' | 'lg'
export type ThemeMode = 'dark' | 'light'
export type ThemeColor = 'navy' | 'midnight' | 'ocean' | 'forest' | 'rose' | 'slate'
export type StartBehavior = 'tray' | 'main'
export type SortBy = 'updatedAt' | 'createdAt' | 'color'

export interface NotePosition {
  x: number
  y: number
}

export interface NoteSize {
  width: number
  height: number
}

export interface Note {
  id: string
  content: string        // Tiptap JSON serialized as string
  color: NoteColor
  opacity: number        // 0.3 ~ 1.0
  position: NotePosition
  size: NoteSize
  isPinned: boolean      // always-on-top
  fontSize: FontSize
  createdAt: string      // ISO 8601
  updatedAt: string
}

export interface AppSettings {
  themeMode: ThemeMode
  themeColor: ThemeColor
  startBehavior: StartBehavior
  spellCheck: boolean
}

export interface CreateNotePayload {
  color?: NoteColor
  position?: NotePosition
}

export interface UpdateNotePayload {
  content?: string
  color?: NoteColor
  opacity?: number
  position?: NotePosition
  size?: NoteSize
  isPinned?: boolean
  fontSize?: FontSize
}

// IPC channel names — single source of truth
export const IPC = {
  NOTE_GET_ALL:       'note:getAll',
  NOTE_CREATE:        'note:create',
  NOTE_UPDATE:        'note:update',
  NOTE_DELETE:        'note:delete',
  NOTE_OPEN_WINDOW:   'note:openWindow',
  NOTE_CLOSE_WINDOW:  'note:closeWindow',
  NOTE_DUPLICATE:        'note:duplicate',
  NOTE_GET_OPEN_WINDOWS: 'note:getOpenWindows',
  NOTE_TOGGLE_WINDOW:    'note:toggleWindow',
  NOTE_EXPORT_TXT:    'note:exportTxt',
  NOTE_EXPORT_ALL:    'note:exportAll',
  WINDOW_SET_PIN:     'window:setPin',
  WINDOW_MINIMIZE:    'window:minimize',
  APP_QUIT:           'app:quit',
  APP_SHOW_MAIN:      'app:showMain',
  SETTINGS_GET:       'settings:get',
  SETTINGS_UPDATE:    'settings:update',
  THEME_CHANGED:      'theme:changed',
} as const
