import { useState, useEffect, useRef } from 'react'
import type { Note } from '../../../../shared/types'
import { useNoteStore } from '../../store/noteStore'

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
  isWindowOpen: boolean
  isDark: boolean
  onClose: () => void
}

function ContextMenu({ x, y, noteId, isWindowOpen, isDark, onClose }: ContextMenuProps): JSX.Element {
  const { deleteNote, duplicateNote, toggleNoteWindow } = useNoteStore()
  const ref = useRef<HTMLDivElement>(null)

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
      <span className="w-3 flex-shrink-0 text-center text-[10px]">
        {check ? '✓' : ''}
      </span>
      {label}
    </button>
  )

  return (
    <div
      ref={ref}
      className="fixed z-[9999] py-1 rounded-lg shadow-xl"
      style={{
        left: x,
        top: y,
        minWidth: 140,
        backgroundColor: menuBg,
        border: `1px solid ${menuBorder}`,
      }}
    >
      {item('노트 팝업', async () => { await toggleNoteWindow(noteId); onClose() }, undefined, isWindowOpen)}
      <div style={{ height: 1, margin: '2px 8px', backgroundColor: menuBorder }} />
      {item('메모 복제', async () => { await duplicateNote(noteId); onClose() })}
      {item('메모 삭제', async () => { await deleteNote(noteId); onClose() }, destructive)}
    </div>
  )
}

export function NoteCard({ note, isDark = true }: Props): JSX.Element {
  const { selectedId, setSelectedId, openWindowIds } = useNoteStore()
  const isSelected = selectedId === note.id
  const isWindowOpen = openWindowIds.has(note.id)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

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
        className="group relative flex items-center gap-0 cursor-pointer border-b transition-colors"
        style={{
          borderColor: 'var(--app-border)',
          backgroundColor: isSelected ? 'var(--app-select)' : 'transparent',
        }}
        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--app-hover)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = isSelected ? 'var(--app-select)' : 'transparent' }}
      >
        {/* color accent bar */}
        <div className={`w-[3px] self-stretch flex-shrink-0 ${COLOR_ACCENT[note.color]}`} />

        {/* content */}
        <div className="flex flex-col px-3 py-2.5 flex-1 min-w-0">
          <span className="text-sm truncate leading-snug" style={{ color: 'var(--app-text)' }}>
            {getTitle(note.content)}
          </span>
          <span className="text-[11px] mt-0.5" style={{ color: 'var(--app-text-dim)' }}>
            {formatDate(note.updatedAt)}
          </span>
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
          isWindowOpen={isWindowOpen}
          isDark={isDark}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  )
}
