import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { CreateNotePayload, UpdateNotePayload, Note, AppSettings } from '../shared/types'

const api = {
  note: {
    getAll: (): Promise<Note[]> => ipcRenderer.invoke(IPC.NOTE_GET_ALL),
    create: (payload?: CreateNotePayload): Promise<Note> => ipcRenderer.invoke(IPC.NOTE_CREATE, payload),
    update: (id: string, payload: UpdateNotePayload): Promise<Note | null> => ipcRenderer.invoke(IPC.NOTE_UPDATE, id, payload),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC.NOTE_DELETE, id),
    openWindow: (noteId: string): Promise<void> => ipcRenderer.invoke(IPC.NOTE_OPEN_WINDOW, noteId),
    closeWindow: (noteId: string): Promise<void> => ipcRenderer.invoke(IPC.NOTE_CLOSE_WINDOW, noteId),
    exportTxt: (noteId: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
      ipcRenderer.invoke(IPC.NOTE_EXPORT_TXT, noteId),
    exportAll: (): Promise<{ success: boolean; count?: number }> =>
      ipcRenderer.invoke(IPC.NOTE_EXPORT_ALL),
    duplicate: (noteId: string): Promise<Note | null> => ipcRenderer.invoke(IPC.NOTE_DUPLICATE, noteId),
    getOpenWindows: (): Promise<string[]> => ipcRenderer.invoke(IPC.NOTE_GET_OPEN_WINDOWS),
    toggleWindow: (noteId: string): Promise<boolean> => ipcRenderer.invoke(IPC.NOTE_TOGGLE_WINDOW, noteId),
    onCreated: (cb: (note: Note) => void) => {
      ipcRenderer.on('note:created', (_e, note) => cb(note))
      return () => ipcRenderer.removeAllListeners('note:created')
    },
    onDeleted: (cb: (id: string) => void) => {
      ipcRenderer.on('note:deleted', (_e, id) => cb(id))
      return () => ipcRenderer.removeAllListeners('note:deleted')
    },
    onWindowOpened: (cb: (noteId: string) => void) => {
      ipcRenderer.on('note:windowOpened', (_e, id) => cb(id))
      return () => ipcRenderer.removeAllListeners('note:windowOpened')
    },
    onWindowClosed: (cb: (noteId: string) => void) => {
      ipcRenderer.on('note:windowClosed', (_e, id) => cb(id))
      return () => ipcRenderer.removeAllListeners('note:windowClosed')
    },
  },
  window: {
    setPin: (noteId: string, pinned: boolean): Promise<Note | null> => ipcRenderer.invoke(IPC.WINDOW_SET_PIN, noteId, pinned),
    minimize: (noteId: string): Promise<void> => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE, noteId),
  },
  app: {
    showMain: (): Promise<void> => ipcRenderer.invoke(IPC.APP_SHOW_MAIN),
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_GET),
    update: (partial: Partial<AppSettings>): Promise<AppSettings> => ipcRenderer.invoke(IPC.SETTINGS_UPDATE, partial),
  },
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: typeof api
  }
}
