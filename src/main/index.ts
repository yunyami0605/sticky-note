import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'
import { initDatabase, getAllNotes, createNote, updateNote, deleteNote } from './services/database'
import { IPC } from '../shared/types'
import type { CreateNotePayload, UpdateNotePayload } from '../shared/types'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
const noteWindows = new Map<string, BrowserWindow>()

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 480,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  win.on('close', (e) => {
    e.preventDefault()
    win.hide()
  })

  return win
}

function createNoteWindow(noteId: string): BrowserWindow {
  const existing = noteWindows.get(noteId)
  if (existing && !existing.isDestroyed()) {
    existing.focus()
    return existing
  }

  const notes = getAllNotes()
  const note = notes.find((n) => n.id === noteId)

  const win = new BrowserWindow({
    width: note?.size.width ?? 280,
    height: note?.size.height ?? 320,
    x: note?.position.x,
    y: note?.position.y,
    minWidth: 200,
    minHeight: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: note?.isPinned ?? false,
    resizable: true,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const url = is.dev && process.env['ELECTRON_RENDERER_URL']
    ? `${process.env['ELECTRON_RENDERER_URL']}/note.html?id=${noteId}`
    : `file://${path.join(__dirname, '../renderer/note.html')}?id=${noteId}`

  win.loadURL(url)
  noteWindows.set(noteId, win)

  win.on('moved', () => {
    const [x, y] = win.getPosition()
    updateNote(noteId, { position: { x, y } })
  })

  win.on('resize', () => {
    const [width, height] = win.getSize()
    updateNote(noteId, { size: { width, height } })
  })

  win.on('closed', () => {
    noteWindows.delete(noteId)
  })

  return win
}

function setupTray(): void {
  const icon = nativeImage.createFromPath(
    path.join(__dirname, '../../resources/tray.png')
  )
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  tray.setToolTip('Sticky Note')

  const menu = Menu.buildFromTemplate([
    { label: '메모 목록 열기', click: () => { mainWindow?.show() } },
    { label: '새 메모', click: () => handleCreateNote() },
    { type: 'separator' },
    { label: '종료', click: () => { app.exit(0) } },
  ])

  tray.setContextMenu(menu)
  tray.on('click', () => { mainWindow?.show() })
}

function handleCreateNote(): void {
  const note = createNote({})
  createNoteWindow(note.id)
  mainWindow?.webContents.send('note:created', note)
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.NOTE_GET_ALL, () => getAllNotes())

  ipcMain.handle(IPC.NOTE_CREATE, (_e, payload: CreateNotePayload) => {
    const note = createNote(payload ?? {})
    createNoteWindow(note.id)
    // 렌더러가 invoke로 요청한 경우 — 프로미스 응답으로 충분하므로 push 이벤트 불필요
    return note
  })

  ipcMain.handle(IPC.NOTE_UPDATE, (_e, id: string, payload: UpdateNotePayload) => {
    return updateNote(id, payload)
  })

  ipcMain.handle(IPC.NOTE_DELETE, (_e, id: string) => {
    const win = noteWindows.get(id)
    if (win && !win.isDestroyed()) {
      win.destroy()
    }
    noteWindows.delete(id)
    const result = deleteNote(id)
    mainWindow?.webContents.send('note:deleted', id)
    return result
  })

  ipcMain.handle(IPC.NOTE_OPEN_WINDOW, (_e, noteId: string) => {
    createNoteWindow(noteId)
  })

  ipcMain.handle(IPC.NOTE_CLOSE_WINDOW, (_e, noteId: string) => {
    const win = noteWindows.get(noteId)
    if (win && !win.isDestroyed()) win.hide()
  })

  ipcMain.handle(IPC.WINDOW_SET_PIN, (_e, noteId: string, pinned: boolean) => {
    const win = noteWindows.get(noteId)
    if (win && !win.isDestroyed()) win.setAlwaysOnTop(pinned)
    return updateNote(noteId, { isPinned: pinned })
  })

  ipcMain.handle(IPC.WINDOW_MINIMIZE, (_e, noteId: string) => {
    noteWindows.get(noteId)?.minimize()
  })

  ipcMain.handle(IPC.APP_SHOW_MAIN, () => {
    mainWindow?.show()
  })
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  mainWindow = createMainWindow()
  setupTray()

  // Reopen all notes that were open at last session
  const notes = getAllNotes()
  for (const note of notes) {
    createNoteWindow(note.id)
  }
})

app.on('window-all-closed', (e) => {
  e.preventDefault()
})

app.on('activate', () => {
  mainWindow?.show()
})

// Suppress default menu on Windows/Linux
if (process.platform !== 'darwin') {
  app.applicationMenu = null
}
