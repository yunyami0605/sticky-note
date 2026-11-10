import { useState, useEffect, useRef } from 'react'
import type { Note } from '../../../../shared/types'
import { useNoteStore } from '../../store/noteStore'
import { useTagStore } from '../../store/tagStore'
import { useFolderStore } from '../../store/folderStore'

const COLOR_ACCENT: Record<Note['color'], string> = {
  yellow: 'bg-yellow-400',
  blue:   'bg-blue-400',
  green:  'bg-green-400',
  pink:   'bg-pink-400',
  purple: 'bg-purple-400',
  white:  'bg-gray-300',
}

interface Props {
  note: Note
  isDark?: boolean
  indent?: boolean
}

function getTitle(content: string): string {
  if (!content) return '메모'
  try {
    const parsed = JSON.parse(content)
    const texts: string[] = []
    const walk = (node: { text?: string; content?: unknown[] }): void => {
      if (node.text) texts.push(node.text)
      node.content?.forEach((c) => walk(c as typeof node))
    }
    parsed.content?.forEach((n: unknown) => walk(n as { text?: string; content?: unknown[] }))
    const title = texts.join(' ').trim()
    return title || '메모'
  } catch {
    return content.slice(0, 40) || '메모'
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)

  if (diffDays === 0) {
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (diffDays === 1) return '어제'
  return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}

interface ContextMenuProps {
  x: number
  y: number
  noteId: string
  currentFolderId: string | null
  isWindowOpen: boolean
  isDark: boolean
  onClose: () => void
}

function ContextMenu({ x, y, noteId, currentFolderId, isWindowOpen, isDark, onClose }: ContextMenuProps): JSX.Element {
  const { deleteNote, duplicateNote, toggleNoteWindow, updateNote } = useNoteStore()
  const { folders } = useFolderStore()
  const ref = useRef<HTMLDivElement>(null)
  const [showFolderMenu, setShowFolderMenu] = useState(false)

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const menuBg = isDark ? '#2a2a3e' : '#ffffff'
  const menuBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
  const menuText = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)'
  const menuHover = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
  const destructive = '#f87171'

  const item = (label: string, onClick: () => void, color?: string, check?: boolean): JSX.Element => (
    <button
      onMouseDown={(e) => { e.stopPropagation(); onClick() }}
      className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors rounded"
      style={{ color: color ?? menuText }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
    >
      <span className="w-3 flex-shrink-0 text-center text-[10px]">{check ? '✓' : ''}</span>
      {label}
    </button>
  )

  const handleMoveToFolder = async (folderId: string | null): Promise<void> => {
    await updateNote(noteId, { folderId })
    onClose()
  }

  return (
    <div
      ref={ref}
      className="fixed z-[9999] py-1 rounded-lg shadow-xl"
      style={{ left: x, top: y, minWidth: 160, backgroundColor: menuBg, border: `1px solid ${menuBorder}` }}
    >
      {item('노트 팝업', async () => { await toggleNoteWindow(noteId); onClose() }, undefined, isWindowOpen)}
      <div style={{ height: 1, margin: '2px 8px', backgroundColor: menuBorder }} />
      {item('메모 복제', async () => { await duplicateNote(noteId); onClose() })}

      {/* 폴더로 이동 */}
      <button
        onMouseDown={(e) => { e.stopPropagation(); setShowFolderMenu((v) => !v) }}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors rounded"
        style={{ color: menuText }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
      >
        <span className="w-3 flex-shrink-0" />
        폴더로 이동
        <span className="ml-auto text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }}>
          {showFolderMenu ? '▾' : '▸'}
        </span>
      </button>

      {showFolderMenu && (
        <div className="ml-3 border-l" style={{ borderColor: menuBorder }}>
          <button
            onMouseDown={(e) => { e.stopPropagation(); handleMoveToFolder(null) }}
            className="flex items-center gap-1.5 w-full px-3 py-1 text-left text-[11px] transition-colors rounded"
            style={{ color: currentFolderId === null ? menuText : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)') }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            <span className="text-[9px] w-2.5">{currentFolderId === null ? '✓' : ''}</span>
            📄 미분류
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onMouseDown={(e) => { e.stopPropagation(); handleMoveToFolder(folder.id) }}
              className="flex items-center gap-1.5 w-full px-3 py-1 text-left text-[11px] transition-colors rounded"
              style={{ color: currentFolderId === folder.id ? menuText : (isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)') }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              <span className="text-[9px] w-2.5">{currentFolderId === folder.id ? '✓' : ''}</span>
              📁 {folder.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ height: 1, margin: '2px 8px', backgroundColor: menuBorder }} />
      {item('메모 삭제', async () => { await deleteNote(noteId); onClose() }, destructive)}
    </div>
  )
}

export function NoteCard({ note, isDark = true, indent = false }: Props): JSX.Element {
  const { selectedId, setSelectedId, openWindowIds } = useNoteStore()
  const { tags, noteTagMap } = useTagStore()
  const isSelected = selectedId === note.id
  const isWindowOpen = openWindowIds.has(note.id)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const noteTags = (noteTagMap[note.id] ?? [])
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean) as typeof tags

  const handleContextMenu = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        onClick={() => setSelectedId(note.id)}
        onContextMenu={handleContextMenu}
        draggable={indent}
        onDragStart={indent ? (e) => {
          e.dataTransfer.setData('dragtype', 'note')
          e.dataTransfer.setData('noteid', note.id)
          e.dataTransfer.effectAllowed = 'move'
          e.stopPropagation()
        } : undefined}
        className="group relative flex items-center gap-0 cursor-pointer border-b transition-colors"
        style={{
          borderColor: 'var(--app-border)',
          backgroundColor: isSelected ? 'var(--app-select)' : 'transparent',
          paddingLeft: indent ? 12 : 0,
        }}
        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--app-hover)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isSelected ? 'var(--app-select)' : 'transparent' }}
      >
        {/* color accent bar */}
        <div className={`w-[3px] self-stretch flex-shrink-0 ${COLOR_ACCENT[note.color]}`} />

        {/* content */}
        <div className="flex flex-col px-2.5 py-2 flex-1 min-w-0">
          <span className="text-sm truncate leading-snug" style={{ color: 'var(--app-text)', fontSize: indent ? '0.75rem' : undefined }}>
            {note.icon && <span className="mr-1">{note.icon}</span>}
            {getTitle(note.content)}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-[10px]" style={{ color: 'var(--app-text-dim)' }}>
              {formatDate(note.updatedAt)}
            </span>
            {noteTags.map((tag) => (
              <span
                key={tag.id}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
                title={tag.name}
              />
            ))}
          </div>
        </div>

        {/* window open indicator dot */}
        {isWindowOpen && (
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mr-[5px]"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)' }}
          />
        )}
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          noteId={note.id}
          currentFolderId={note.folderId}
          isWindowOpen={isWindowOpen}
          isDark={isDark}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  )
}
