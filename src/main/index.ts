import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell, session } from 'electron'
import path from 'path'
import fs from 'fs'
import { is } from '@electron-toolkit/utils'
import {
  initDatabase, getAllNotes, createNote, updateNote, deleteNote,
  getSettings, updateSettings, noteToPlainText, noteToMarkdown, getNoteTitle,
  getAllFolders, createFolder, updateFolder, deleteFolder,
  getAllTags, createTag, updateTag, deleteTag,
  getNoteTagIds, setNoteTag, removeNoteTag,
} from './services/database'
import { IPC } from '../shared/types'
import type { CreateNotePayload, UpdateNotePayload, AppSettings, CreateFolderPayload, UpdateFolderPayload, CreateTagPayload, UpdateTagPayload } from '../shared/types'

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
    existing.show()
    existing.focus()
    mainWindow?.webContents.send('note:windowOpened', noteId)
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
    mainWindow?.webContents.send('note:windowClosed', noteId)
  })

  mainWindow?.webContents.send('note:windowOpened', noteId)
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
    return note
  })

  ipcMain.handle(IPC.NOTE_UPDATE, (_e, id: string, payload: UpdateNotePayload) => {
    return updateNote(id, payload)
  })

  ipcMain.handle(IPC.NOTE_DELETE, (_e, id: string) => {
    const win = noteWindows.get(id)
    if (win && !win.isDestroyed()) win.destroy()
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
    if (win && !win.isDestroyed()) {
      win.hide()
      mainWindow?.webContents.send('note:windowClosed', noteId)
    }
  })

  ipcMain.handle(IPC.NOTE_DUPLICATE, (_e, noteId: string) => {
    const notes = getAllNotes()
    const src = notes.find((n) => n.id === noteId)
    if (!src) return null
    const note = createNote({
      color: src.color,
      position: { x: (src.position.x ?? 100) + 24, y: (src.position.y ?? 100) + 24 },
    })
    const updated = updateNote(note.id, {
      content: src.content,
      fontSize: src.fontSize,
      opacity: src.opacity,
      size: src.size,
    })
    createNoteWindow(note.id)
    mainWindow?.webContents.send('note:created', updated ?? note)
    return updated ?? note
  })

  ipcMain.handle(IPC.NOTE_GET_OPEN_WINDOWS, () => {
    const openIds: string[] = []
    noteWindows.forEach((win, id) => {
      if (!win.isDestroyed() && win.isVisible()) openIds.push(id)
    })
    return openIds
  })

  ipcMain.handle(IPC.NOTE_TOGGLE_WINDOW, (_e, noteId: string) => {
    const win = noteWindows.get(noteId)
    if (win && !win.isDestroyed()) {
      if (win.isVisible()) {
        win.hide()
        mainWindow?.webContents.send('note:windowClosed', noteId)
        return false
      } else {
        win.show()
        win.focus()
        mainWindow?.webContents.send('note:windowOpened', noteId)
        return true
      }
    }
    createNoteWindow(noteId)
    return true
  })

  // ── 단일 메모 TXT 내보내기 ────────────────────────────────
  ipcMain.handle(IPC.NOTE_EXPORT_TXT, async (_e, noteId: string) => {
    const notes = getAllNotes()
    const note = notes.find((n) => n.id === noteId)
    if (!note) return { success: false, error: '메모를 찾을 수 없습니다.' }

    const title = getNoteTitle(note.content)
    const safeName = title.replace(/[/\\?%*:|"<>]/g, '_')

    const { filePath } = await dialog.showSaveDialog({
      title: '메모 내보내기',
      defaultPath: `${safeName}.txt`,
      filters: [{ name: 'Text File', extensions: ['txt'] }],
    })
    if (!filePath) return { success: false }

    fs.writeFileSync(filePath, noteToPlainText(note.content), 'utf-8')
    shell.showItemInFolder(filePath)
    return { success: true, filePath }
  })

  // ── 전체 메모 TXT 내보내기 ────────────────────────────────
  ipcMain.handle(IPC.NOTE_EXPORT_ALL, async () => {
    const { filePaths } = await dialog.showOpenDialog({
      title: '저장 폴더 선택',
      properties: ['openDirectory', 'createDirectory'],
    })
    if (!filePaths?.[0]) return { success: false }

    const notes = getAllNotes()
    for (const note of notes) {
      const title = getNoteTitle(note.content)
      const safeName = title.replace(/[/\\?%*:|"<>]/g, '_') || note.id.slice(0, 8)
      const filePath = path.join(filePaths[0], `${safeName}.txt`)
      fs.writeFileSync(filePath, noteToPlainText(note.content), 'utf-8')
    }
    shell.openPath(filePaths[0])
    return { success: true, count: notes.length }
  })

  // ── 창 제어 ───────────────────────────────────────────────
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

  // ── 설정 ─────────────────────────────────────────────────
  ipcMain.handle(IPC.SETTINGS_GET, () => getSettings())

  ipcMain.handle(IPC.SETTINGS_UPDATE, (_e, partial: Partial<AppSettings>) => {
    return updateSettings(partial)
  })

  // ── Markdown 내보내기 ─────────────────────────────────────
  ipcMain.handle(IPC.NOTE_EXPORT_MD, async (_e, noteId: string) => {
    const notes = getAllNotes()
    const note = notes.find((n) => n.id === noteId)
    if (!note) return { success: false, error: '메모를 찾을 수 없습니다.' }

    const title = getNoteTitle(note.content)
    const safeName = title.replace(/[/\\?%*:|"<>]/g, '_')

    const { filePath } = await dialog.showSaveDialog({
      title: '마크다운으로 내보내기',
      defaultPath: `${safeName}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (!filePath) return { success: false }

    fs.writeFileSync(filePath, noteToMarkdown(note.content), 'utf-8')
    shell.showItemInFolder(filePath)
    return { success: true, filePath }
  })

  // ── 폴더 ─────────────────────────────────────────────────
  ipcMain.handle(IPC.FOLDER_GET_ALL, () => getAllFolders())

  ipcMain.handle(IPC.FOLDER_CREATE, (_e, payload: CreateFolderPayload) => createFolder(payload))

  ipcMain.handle(IPC.FOLDER_UPDATE, (_e, id: string, payload: UpdateFolderPayload) => updateFolder(id, payload))

  ipcMain.handle(IPC.FOLDER_DELETE, (_e, id: string) => deleteFolder(id))

  // ── 태그 ─────────────────────────────────────────────────
  ipcMain.handle(IPC.TAG_GET_ALL, () => getAllTags())

  ipcMain.handle(IPC.TAG_CREATE, (_e, payload: CreateTagPayload) => createTag(payload))

  ipcMain.handle(IPC.TAG_UPDATE, (_e, id: string, payload: UpdateTagPayload) => updateTag(id, payload))

  ipcMain.handle(IPC.TAG_DELETE, (_e, id: string) => deleteTag(id))

  ipcMain.handle(IPC.NOTE_GET_TAGS, (_e, noteId: string) => getNoteTagIds(noteId))

  ipcMain.handle(IPC.NOTE_SET_TAG, (_e, noteId: string, tagId: string) => { setNoteTag(noteId, tagId) })

  ipcMain.handle(IPC.NOTE_REMOVE_TAG, (_e, noteId: string, tagId: string) => { removeNoteTag(noteId, tagId) })
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()

  // Windows 한국어 맞춤법 검사: 시스템 언어팩 활용 (Method 1)
  // macOS는 OS 레벨에서 자동 처리되므로 별도 설정 불필요
  if (process.platform === 'win32') {
    session.defaultSession.setSpellCheckerLanguages(['ko-KR', 'en-US'])
  }

  const settings = getSettings()

  mainWindow = createMainWindow()
  if (settings.startBehavior === 'tray') {
    mainWindow.hide()
  }

  setupTray()

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

if (process.platform !== 'darwin') {
  app.applicationMenu = null
}
