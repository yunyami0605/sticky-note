export type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'white'
export type FontSize = 'sm' | 'md' | 'lg'
export type ThemeMode = 'dark' | 'light'
export type ThemeColor = 'navy' | 'midnight' | 'ocean' | 'forest' | 'rose' | 'slate'
export type StartBehavior = 'tray' | 'main'
export type SortBy = 'updatedAt' | 'createdAt' | 'color' | 'manual'

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
  content: string
  color: NoteColor
  opacity: number
  position: NotePosition
  size: NoteSize
  isPinned: boolean
  fontSize: FontSize
  folderId: string | null
  icon: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: string
  name: string
  sortOrder: number
  parentId: string | null
  createdAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface KeyShortcut {
  key: string
  meta: boolean
  ctrl: boolean
  shift: boolean
  alt: boolean
}

export interface ShortcutSettings {
  newNote: KeyShortcut
  searchFocus: KeyShortcut
  openSettings: KeyShortcut
  toggleSidebar: KeyShortcut
}

export interface AppSettings {
  themeMode: ThemeMode
  themeColor: ThemeColor
  startBehavior: StartBehavior
  spellCheck: boolean
  shortcuts: ShortcutSettings
}

export interface CreateNotePayload {
  color?: NoteColor
  position?: NotePosition
  folderId?: string | null
}

export interface UpdateNotePayload {
  content?: string
  color?: NoteColor
  opacity?: number
  position?: NotePosition
  size?: NoteSize
  isPinned?: boolean
  fontSize?: FontSize
  folderId?: string | null
  icon?: string | null
  sortOrder?: number
}

export interface CreateFolderPayload {
  name: string
}

export interface UpdateFolderPayload {
  name?: string
  sortOrder?: number
  parentId?: string | null
}

export interface CreateTagPayload {
  name: string
  color: string
}

export interface UpdateTagPayload {
  name?: string
  color?: string
}

// IPC channel names — single source of truth
export const IPC = {
  NOTE_GET_ALL:          'note:getAll',
  NOTE_CREATE:           'note:create',
  NOTE_UPDATE:           'note:update',
  NOTE_DELETE:           'note:delete',
  NOTE_OPEN_WINDOW:      'note:openWindow',
  NOTE_CLOSE_WINDOW:     'note:closeWindow',
  NOTE_DUPLICATE:        'note:duplicate',
  NOTE_GET_OPEN_WINDOWS: 'note:getOpenWindows',
  NOTE_TOGGLE_WINDOW:    'note:toggleWindow',
  NOTE_EXPORT_TXT:       'note:exportTxt',
  NOTE_EXPORT_ALL:       'note:exportAll',
  NOTE_EXPORT_MD:        'note:exportMd',
  NOTE_IMPORT_MD:        'note:importMd',
  NOTE_REORDER:          'note:reorder',
  NOTE_GET_TAGS:         'note:getTags',
  NOTE_SET_TAG:          'note:setTag',
  NOTE_REMOVE_TAG:       'note:removeTag',
  FOLDER_GET_ALL:        'folder:getAll',
  FOLDER_CREATE:         'folder:create',
  FOLDER_UPDATE:         'folder:update',
  FOLDER_DELETE:         'folder:delete',
  FOLDER_DUPLICATE:      'folder:duplicate',
  TAG_GET_ALL:           'tag:getAll',
  TAG_CREATE:            'tag:create',
  TAG_UPDATE:            'tag:update',
  TAG_DELETE:            'tag:delete',
  WINDOW_SET_PIN:        'window:setPin',
  WINDOW_MINIMIZE:       'window:minimize',
  APP_QUIT:              'app:quit',
  APP_SHOW_MAIN:         'app:showMain',
  SETTINGS_GET:          'settings:get',
  SETTINGS_UPDATE:       'settings:update',
  THEME_CHANGED:         'theme:changed',
} as const
