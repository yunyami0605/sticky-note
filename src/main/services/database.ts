import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type {
  Note, CreateNotePayload, UpdateNotePayload, NoteColor, AppSettings,
  ThemeMode, ThemeColor, StartBehavior, ShortcutSettings,
  Folder, CreateFolderPayload, UpdateFolderPayload,
  Tag, CreateTagPayload, UpdateTagPayload,
} from '../../shared/types'

function defaultShortcuts(platform: string): ShortcutSettings {
  const isMac = platform === 'darwin'
  return {
    newNote:       { key: 'n',  meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    searchFocus:   { key: 'f',  meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    openSettings:  { key: ',',  meta: isMac,  ctrl: !isMac, shift: false, alt: false },
    toggleSidebar: { key: '\\', meta: isMac,  ctrl: !isMac, shift: false, alt: false },
  }
}

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

  // Migration: add new columns if missing
  const noteColumns = (db.pragma('table_info(notes)') as { name: string }[]).map((c) => c.name)
  if (!noteColumns.includes('folder_id')) db.exec(`ALTER TABLE notes ADD COLUMN folder_id TEXT`)
  if (!noteColumns.includes('icon')) db.exec(`ALTER TABLE notes ADD COLUMN icon TEXT`)

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      color      TEXT NOT NULL DEFAULT '#6366f1',
      created_at TEXT NOT NULL
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      tag_id  TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (note_id, tag_id)
    )
  `)
}

// ── Notes ─────────────────────────────────────────────────────

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
    folderId: (row.folder_id as string | null) ?? null,
    icon: (row.icon as string | null) ?? null,
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
    folderId: payload.folderId ?? null,
    icon: null,
    createdAt: now,
    updatedAt: now,
  }

  db.prepare(`
    INSERT INTO notes (id, content, color, opacity, pos_x, pos_y, width, height, is_pinned, font_size, folder_id, icon, created_at, updated_at)
    VALUES (@id, @content, @color, @opacity, @posX, @posY, @width, @height, @isPinned, @fontSize, @folderId, @icon, @createdAt, @updatedAt)
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
    folderId: note.folderId,
    icon: note.icon,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  })

  return note
}

export function updateNote(id: string, payload: UpdateNotePayload): Note | null {
  const existing = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null

  const updatedAt = new Date().toISOString()
  const merged = { ...rowToNote(existing), ...payload, updatedAt }

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
      folder_id  = @folderId,
      icon       = @icon,
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
    folderId: 'folderId' in payload ? payload.folderId : (existing.folder_id as string | null),
    icon: 'icon' in payload ? payload.icon : (existing.icon as string | null),
    updatedAt,
  })

  return merged
}

export function deleteNote(id: string): boolean {
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id)
  return result.changes > 0
}

// ── Note Tags ─────────────────────────────────────────────────

export function getNoteTagIds(noteId: string): string[] {
  const rows = db.prepare('SELECT tag_id FROM note_tags WHERE note_id = ?').all(noteId) as { tag_id: string }[]
  return rows.map((r) => r.tag_id)
}

export function setNoteTag(noteId: string, tagId: string): void {
  db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)').run(noteId, tagId)
}

export function removeNoteTag(noteId: string, tagId: string): void {
  db.prepare('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?').run(noteId, tagId)
}

// ── Folders ───────────────────────────────────────────────────

function rowToFolder(row: Record<string, unknown>): Folder {
  return {
    id: row.id as string,
    name: row.name as string,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
  }
}

export function getAllFolders(): Folder[] {
  const rows = db.prepare('SELECT * FROM folders ORDER BY sort_order ASC, created_at ASC').all()
  return (rows as Record<string, unknown>[]).map(rowToFolder)
}

export function createFolder(payload: CreateFolderPayload): Folder {
  const now = new Date().toISOString()
  const folder: Folder = { id: uuidv4(), name: payload.name, sortOrder: 0, createdAt: now }
  db.prepare('INSERT INTO folders (id, name, sort_order, created_at) VALUES (@id, @name, @sortOrder, @createdAt)')
    .run({ id: folder.id, name: folder.name, sortOrder: folder.sortOrder, createdAt: folder.createdAt })
  return folder
}

export function updateFolder(id: string, payload: UpdateFolderPayload): Folder | null {
  const existing = db.prepare('SELECT * FROM folders WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null
  db.prepare('UPDATE folders SET name = @name, sort_order = @sortOrder WHERE id = @id').run({
    id,
    name: payload.name ?? (existing.name as string),
    sortOrder: payload.sortOrder ?? (existing.sort_order as number),
  })
  return rowToFolder({ ...existing, name: payload.name ?? existing.name, sort_order: payload.sortOrder ?? existing.sort_order })
}

export function deleteFolder(id: string): boolean {
  db.prepare('UPDATE notes SET folder_id = NULL WHERE folder_id = ?').run(id)
  const result = db.prepare('DELETE FROM folders WHERE id = ?').run(id)
  return result.changes > 0
}

// ── Tags ──────────────────────────────────────────────────────

function rowToTag(row: Record<string, unknown>): Tag {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    createdAt: row.created_at as string,
  }
}

export function getAllTags(): Tag[] {
  const rows = db.prepare('SELECT * FROM tags ORDER BY created_at ASC').all()
  return (rows as Record<string, unknown>[]).map(rowToTag)
}

export function createTag(payload: CreateTagPayload): Tag {
  const now = new Date().toISOString()
  const tag: Tag = { id: uuidv4(), name: payload.name, color: payload.color, createdAt: now }
  db.prepare('INSERT INTO tags (id, name, color, created_at) VALUES (@id, @name, @color, @createdAt)')
    .run({ id: tag.id, name: tag.name, color: tag.color, createdAt: tag.createdAt })
  return tag
}

export function updateTag(id: string, payload: UpdateTagPayload): Tag | null {
  const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) return null
  db.prepare('UPDATE tags SET name = @name, color = @color WHERE id = @id').run({
    id,
    name: payload.name ?? (existing.name as string),
    color: payload.color ?? (existing.color as string),
  })
  return rowToTag({ ...existing, name: payload.name ?? existing.name, color: payload.color ?? existing.color })
}

export function deleteTag(id: string): boolean {
  const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id)
  return result.changes > 0
}

// ── Settings ──────────────────────────────────────────────────

export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const map: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.value]))
  let shortcuts = defaultShortcuts(process.platform)
  if (map['shortcuts']) {
    try { shortcuts = JSON.parse(map['shortcuts']) } catch { /* use defaults */ }
  }
  return {
    themeMode: (map['themeMode'] ?? 'dark') as ThemeMode,
    themeColor: (map['themeColor'] ?? 'navy') as ThemeColor,
    startBehavior: (map['startBehavior'] ?? 'main') as StartBehavior,
    spellCheck: map['spellCheck'] === 'true',
    shortcuts,
  }
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
  for (const [key, value] of Object.entries(partial)) {
    if (value === undefined) continue
    if (key === 'shortcuts') stmt.run(key, JSON.stringify(value))
    else stmt.run(key, String(value))
  }
  return getSettings()
}

// ── TXT / Markdown export helpers ────────────────────────────

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
    case 'callout':     return `> 💡 ${children}`
    default:            return children
  }
}

function nodeToMarkdown(node: TipNode, listIndex?: number): string {
  if (node.type === 'text') {
    let text = node.text ?? ''
    const marks = (node as unknown as { marks?: { type: string; attrs?: Record<string, unknown> }[] }).marks ?? []
    for (const mark of marks) {
      if (mark.type === 'bold') text = `**${text}**`
      else if (mark.type === 'italic') text = `*${text}*`
      else if (mark.type === 'strike') text = `~~${text}~~`
      else if (mark.type === 'code') text = `\`${text}\``
    }
    return text
  }
  if (node.type === 'hardBreak') return '  \n'

  const children = (node.content ?? []).map((c, i) => nodeToMarkdown(c, i + 1)).join('')

  switch (node.type) {
    case 'doc':       return children
    case 'paragraph': return children + '\n'
    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      return '#'.repeat(level) + ' ' + children + '\n'
    }
    case 'bulletList':  return children
    case 'orderedList': return children
    case 'listItem':    return `- ${children.trimStart()}`
    case 'taskList':    return children
    case 'taskItem':    return `- [${node.attrs?.checked ? 'x' : ' '}] ${children.trimStart()}`
    case 'blockquote':  return children.split('\n').map((l) => `> ${l}`).join('\n') + '\n'
    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? ''
      return `\`\`\`${lang}\n${children}\`\`\`\n`
    }
    case 'horizontalRule': return '---\n'
    case 'callout':     return `> 💡 ${children}`
    default:            return children
  }
}

export function noteToPlainText(content: string): string {
  if (!content) return ''
  try {
    const doc = JSON.parse(content) as TipNode
    return nodeToText(doc).replace(/\n{3,}/g, '\n\n').trim()
  } catch {
    return content
  }
}

export function noteToMarkdown(content: string): string {
  if (!content) return ''
  try {
    const doc = JSON.parse(content) as TipNode
    return nodeToMarkdown(doc).replace(/\n{3,}/g, '\n\n').trim()
  } catch {
    return content
  }
}

// ── Markdown → Tiptap JSON ────────────────────────────────────

type InlineNode = { type: 'text'; text: string; marks?: { type: string }[] }

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = []
  // patterns: **bold**, *italic*, ~~strike~~, `code`
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`(.+?)`)/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push({ type: 'text', text: text.slice(last, m.index) })
    if (m[2] !== undefined) nodes.push({ type: 'text', text: m[2], marks: [{ type: 'bold' }] })
    else if (m[3] !== undefined) nodes.push({ type: 'text', text: m[3], marks: [{ type: 'italic' }] })
    else if (m[4] !== undefined) nodes.push({ type: 'text', text: m[4], marks: [{ type: 'strike' }] })
    else if (m[5] !== undefined) nodes.push({ type: 'text', text: m[5], marks: [{ type: 'code' }] })
    last = m.index + m[0].length
  }
  if (last < text.length) nodes.push({ type: 'text', text: text.slice(last) })
  return nodes
}

function paragraph(text: string): TipNode {
  return { type: 'paragraph', content: parseInline(text) }
}

export function markdownToTiptapJSON(md: string): string {
  const lines = md.split('\n')
  const blocks: TipNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 빈 줄
    if (line.trim() === '') { i++; continue }

    // 구분선
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: 'horizontalRule' })
      i++; continue
    }

    // 헤딩
    const headingM = line.match(/^(#{1,3})\s+(.*)$/)
    if (headingM) {
      blocks.push({ type: 'heading', attrs: { level: headingM[1].length }, content: parseInline(headingM[2]) })
      i++; continue
    }

    // 코드 블록
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // closing ```
      blocks.push({
        type: 'codeBlock',
        attrs: { language: lang || null },
        content: [{ type: 'text', text: codeLines.join('\n') }],
      })
      continue
    }

    // 인용문 (연속 > 줄 묶기)
    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.map((l) => paragraph(l)),
      })
      continue
    }

    // 체크리스트
    const taskM = line.match(/^-\s+\[( |x)\]\s+(.*)$/)
    if (taskM) {
      const items: TipNode[] = []
      let cur = line
      while (cur) {
        const m = cur.match(/^-\s+\[( |x)\]\s+(.*)$/)
        if (!m) break
        items.push({
          type: 'taskItem',
          attrs: { checked: m[1] === 'x' },
          content: [paragraph(m[2])],
        })
        i++
        cur = lines[i] ?? ''
        if (!cur.match(/^-\s+\[( |x)\]/)) break
      }
      blocks.push({ type: 'taskList', content: items })
      continue
    }

    // 불릿 목록
    if (/^[-*]\s+/.test(line)) {
      const items: TipNode[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        const text = lines[i].replace(/^[-*]\s+/, '')
        items.push({ type: 'listItem', content: [paragraph(text)] })
        i++
      }
      blocks.push({ type: 'bulletList', content: items })
      continue
    }

    // 번호 목록
    if (/^\d+\.\s+/.test(line)) {
      const items: TipNode[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s+/, '')
        items.push({ type: 'listItem', content: [paragraph(text)] })
        i++
      }
      blocks.push({ type: 'orderedList', content: items })
      continue
    }

    // 일반 단락
    blocks.push(paragraph(line))
    i++
  }

  return JSON.stringify({ type: 'doc', content: blocks.length ? blocks : [{ type: 'paragraph' }] })
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
