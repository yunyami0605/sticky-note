import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { Note, CreateNotePayload, UpdateNotePayload, NoteColor, AppSettings, ThemeMode, ThemeColor, StartBehavior } from '../../shared/types'

const DEFAULT_SIZE = { width: 280, height: 320 }
const DEFAULT_COLOR: NoteColor = 'yellow'

let db: Database.Database

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'notes.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      content    TEXT NOT NULL DEFAULT '{}',
      color      TEXT NOT NULL DEFAULT 'yellow',
      opacity    REAL NOT NULL DEFAULT 1.0,
      pos_x      INTEGER NOT NULL DEFAULT 100,
      pos_y      INTEGER NOT NULL DEFAULT 100,
      width      INTEGER NOT NULL DEFAULT 280,
      height     INTEGER NOT NULL DEFAULT 320,
      is_pinned  INTEGER NOT NULL DEFAULT 0,
      font_size  TEXT NOT NULL DEFAULT 'md',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    content: row.content as string,
    color: row.color as Note['color'],
    opacity: row.opacity as number,
    position: { x: row.pos_x as number, y: row.pos_y as number },
    size: { width: row.width as number, height: row.height as number },
    isPinned: Boolean(row.is_pinned),
    fontSize: row.font_size as Note['fontSize'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function getAllNotes(): Note[] {
  const rows = db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all()
  return (rows as Record<string, unknown>[]).map(rowToNote)
}

export function createNote(payload: CreateNotePayload): Note {
  const now = new Date().toISOString()
  const note: Note = {
    id: uuidv4(),
    content: '',
    color: payload.color ?? DEFAULT_COLOR,
    opacity: 1.0,
    position: payload.position ?? { x: 120, y: 120 },
    size: DEFAULT_SIZE,
    isPinned: false,
    fontSize: 'md',
    createdAt: now,
    updatedAt: now,
  }

  db.prepare(`
    INSERT INTO notes (id, content, color, opacity, pos_x, pos_y, width, height, is_pinned, font_size, created_at, updated_at)
    VALUES (@id, @content, @color, @opacity, @posX, @posY, @width, @height, @isPinned, @fontSize, @createdAt, @updatedAt)
  `).run({
    id: note.id,
    content: note.content,
    color: note.color,
    opacity: note.opacity,
    posX: note.position.x,
    posY: note.position.y,
    width: note.size.width,
    height: note.size.height,
    isPinned: note.isPinned ? 1 : 0,
    fontSize: note.fontSize,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  })

  return note
}

export function updateNote(id: string, payload: UpdateNotePayload): Note | null {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null

  const updatedAt = new Date().toISOString()
  const merged = {
    ...rowToNote(existing),
    ...payload,
    updatedAt,
  }

  db.prepare(`
    UPDATE notes SET
      content    = @content,
      color      = @color,
      opacity    = @opacity,
      pos_x      = @posX,
      pos_y      = @posY,
      width      = @width,
      height     = @height,
      is_pinned  = @isPinned,
      font_size  = @fontSize,
      updated_at = @updatedAt
    WHERE id = @id
  `).run({
    id,
    content: payload.content ?? (existing.content as string),
    color: payload.color ?? (existing.color as string),
    opacity: payload.opacity ?? (existing.opacity as number),
    posX: payload.position?.x ?? (existing.pos_x as number),
    posY: payload.position?.y ?? (existing.pos_y as number),
    width: payload.size?.width ?? (existing.width as number),
    height: payload.size?.height ?? (existing.height as number),
    isPinned: (payload.isPinned ?? Boolean(existing.is_pinned)) ? 1 : 0,
    fontSize: payload.fontSize ?? (existing.font_size as string),
    updatedAt,
  })

  return merged
}

export function deleteNote(id: string): boolean {
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id)
  return result.changes > 0
}

// ── Settings ──────────────────────────────────────────────────

export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const map: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  return {
    themeMode: (map['themeMode'] ?? 'dark') as ThemeMode,
    themeColor: (map['themeColor'] ?? 'navy') as ThemeColor,
    startBehavior: (map['startBehavior'] ?? 'main') as StartBehavior,
    spellCheck: map['spellCheck'] === 'true',
  }
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  for (const [key, value] of Object.entries(partial)) {
    if (value !== undefined) stmt.run(key, String(value))
  }
  return getSettings()
}

// ── TXT export helpers ────────────────────────────────────────

type TipNode = { type?: string; text?: string; content?: TipNode[]; attrs?: Record<string, unknown> }

function nodeToText(node: TipNode, listIndex?: number): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'

  const children = (node.content ?? []).map((c, i) => nodeToText(c, i + 1)).join('')

  switch (node.type) {
    case 'doc':       return children
    case 'paragraph': return children + '\n'
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      return '#'.repeat(level) + ' ' + children + '\n'
    }
    case 'bulletList':  return children
    case 'orderedList': return children
    case 'listItem':    return `• ${children.trimStart()}`
    case 'taskList':    return children
    case 'taskItem':    return `[${node.attrs?.checked ? 'x' : ' '}] ${children.trimStart()}`
    case 'blockquote':  return children.split('\n').map((l) => `> ${l}`).join('\n') + '\n'
    case 'codeBlock':   return '```\n' + children + '```\n'
    default:            return children
  }
}

export function noteToPlainText(content: string): string {
  if (!content) return ''
  try {
    const doc = JSON.parse(content) as TipNode
    // also extract ordered list numbers by tracking index per parent
    return nodeToText(doc).replace(/\n{3,}/g, '\n\n').trim()
  } catch {
    return content
  }
}

export function getNoteTitle(content: string): string {
  if (!content) return '메모'
  try {
    const doc = JSON.parse(content) as TipNode
    const texts: string[] = []
    const walk = (n: TipNode): void => {
      if (n.text) texts.push(n.text)
      n.content?.forEach(walk)
    }
    doc.content?.forEach(walk)
    return texts.join(' ').trim().slice(0, 60) || '메모'
  } catch {
    return '메모'
  }
}
