import { useState, useEffect, useRef } from 'react'
import type { Note } from '../../../../shared/types'
import { useNoteStore } from '../../store/noteStore'
import { useTagStore } from '../../store/tagStore'
import { useFolderStore } from '../../store/folderStore'

const COLOR_ACCENT: Record<Note['color'], string> = {
  yellow: 'bg-amber-400',
  blue:   'bg-blue-500',
  green:  'bg-emerald-500',
  pink:   'bg-pink-500',
  purple: 'bg-violet-500',
  white:  'bg-slate-300',
}

interface Props {
  note: Note
  isDark?: boolean
  indent?: boolean
  selectionMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

function getTitle(content: string): string {
  if (!content) return '새 메모'
  try {
    const parsed = JSON.parse(content)
    const texts: string[] = []
    const walk = (node: { text?: string; content?: unknown[] }): void => {
      if (node.text) texts.push(node.text)
      node.content?.forEach((c) => walk(c as typeof node))
    }
    parsed.content?.forEach((n: unknown) => walk(n as { text?: string; content?: unknown[] }))
    return texts.join(' ').trim() || '새 메모'
  } catch {
    return content.slice(0, 40) || '새 메모'
  }
}

function getPreview(content: string): string {
  if (!content) return ''
  try {
    const parsed = JSON.parse(content)
    const lines: string[] = []
    parsed.content?.forEach((block: unknown) => {
      const blockTexts: string[] = []
      const walk = (node: { text?: string; content?: unknown[] }): void => {
        if (node.text) blockTexts.push(node.text)
        node.content?.forEach((c) => walk(c as typeof node))
      }
      walk(block as { text?: string; content?: unknown[] })
      const line = blockTexts.join('').trim()
      if (line) lines.push(line)
    })
    return lines.slice(1).join(' ').trim().slice(0, 80)
  } catch { return '' }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '방금'
  if (diffMins < 60) return `${diffMins}분 전`
  if (diffDays === 0) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
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

  const menuBg     = isDark ? '#1e1e2e' : '#ffffff'
  const menuBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'
  const menuText   = isDark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.78)'
  const menuHover  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.045)'
  const destructive = '#f87171'

  const item = (label: string, onClick: () => void, color?: string, check?: boolean): JSX.Element => (
    <button
      onMouseDown={(e) => { e.stopPropagation(); onClick() }}
      className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors rounded-md"
      style={{ color: color ?? menuText }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
    >
      <span className="w-3 flex-shrink-0 text-center text-[10px]">{check ? '✓' : ''}</span>
      {label}
    </button>
  )

  const sep = (): JSX.Element => (
    <div style={{ height: 1, margin: '3px 10px', backgroundColor: menuBorder }} />
  )

  const handleMoveToFolder = async (folderId: string | null): Promise<void> => {
    await updateNote(noteId, { folderId })
    onClose()
  }

  return (
    <div
      ref={ref}
      className="fixed z-[9999] py-1.5 rounded-xl shadow-2xl"
      style={{
        left: x, top: y, minWidth: 168,
        backgroundColor: menuBg,
        border: `1px solid ${menuBorder}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="px-1">
        {item('노트 팝업', async () => { await toggleNoteWindow(noteId); onClose() }, undefined, isWindowOpen)}
        {sep()}
        {item('메모 복제', async () => { await duplicateNote(noteId); onClose() })}

        <button
          onMouseDown={(e) => { e.stopPropagation(); setShowFolderMenu((v) => !v) }}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors rounded-md"
          style={{ color: menuText }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <span className="w-3 flex-shrink-0" />
          폴더로 이동
          <span className="ml-auto text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.28)' }}>
            {showFolderMenu ? '▾' : '▸'}
          </span>
        </button>

        {showFolderMenu && (
          <div className="ml-2 my-0.5 pl-2 border-l" style={{ borderColor: menuBorder }}>
            <button
              onMouseDown={(e) => { e.stopPropagation(); handleMoveToFolder(null) }}
              className="flex items-center gap-1.5 w-full px-2 py-1 text-left text-[11px] transition-colors rounded-md"
              style={{ color: currentFolderId === null ? menuText : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)') }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              <span className="text-[9px] w-2.5">{currentFolderId === null ? '✓' : ''}</span>
              미분류
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onMouseDown={(e) => { e.stopPropagation(); handleMoveToFolder(folder.id) }}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-left text-[11px] transition-colors rounded-md"
                style={{ color: currentFolderId === folder.id ? menuText : (isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.42)') }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
              >
                <span className="text-[9px] w-2.5">{currentFolderId === folder.id ? '✓' : ''}</span>
                {folder.name}
              </button>
            ))}
          </div>
        )}

        {sep()}
        {item('메모 삭제', async () => { await deleteNote(noteId); onClose() }, destructive)}
      </div>
    </div>
  )
}

export function NoteCard({ note, isDark = true, indent = false, selectionMode = false, selected = false, onToggleSelect }: Props): JSX.Element {
  const { selectedId, setSelectedId, openWindowIds } = useNoteStore()
  const { tags, noteTagMap } = useTagStore()
  const isSelected = !selectionMode && selectedId === note.id
  const isWindowOpen = openWindowIds.has(note.id)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const noteTags = (noteTagMap[note.id] ?? [])
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean) as typeof tags

  const title = getTitle(note.content)
  const preview = getPreview(note.content)

  const handleContextMenu = (e: React.MouseEvent): void => {
    if (selectionMode) return
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY })
  }

  const handleClick = (): void => {
    if (selectionMode) {
      onToggleSelect?.()
    } else {
      setSelectedId(note.id)
    }
  }

  const isHighlighted = isSelected || (selectionMode && selected)

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable={indent && !selectionMode}
        onDragStart={indent && !selectionMode ? (e) => {
          e.dataTransfer.setData('dragtype', 'note')
          e.dataTransfer.setData('noteid', note.id)
          e.dataTransfer.effectAllowed = 'move'
          e.stopPropagation()
        } : undefined}
        className="group relative flex items-stretch cursor-pointer border-b transition-colors"
        style={{
          borderColor: 'var(--app-border)',
          backgroundColor: isHighlighted ? 'var(--app-select)' : 'transparent',
          paddingLeft: indent ? 12 : 0,
        }}
        onMouseEnter={(e) => {
          if (!isHighlighted) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--app-hover)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = isHighlighted ? 'var(--app-select)' : 'transparent'
        }}
      >
        {/* 색상 액센트 바 or 선택 체크박스 */}
        {selectionMode ? (
          <div className="w-5 flex-shrink-0 flex items-center justify-center">
            <span
              className="w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
              style={{
                border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.28)'}`,
                backgroundColor: selected ? '#6366f1' : 'transparent',
                color: '#fff',
              }}
            >{selected ? '✓' : ''}</span>
          </div>
        ) : (
          <div
            className={`w-[3px] flex-shrink-0 rounded-r-sm ${COLOR_ACCENT[note.color]}`}
            style={{ opacity: isSelected ? 1 : 0.45 }}
          />
        )}

        {/* 내용 */}
        <div className="flex flex-col px-3 py-2.5 flex-1 min-w-0 gap-0.5">
          {/* 제목 */}
          <span
            className="text-[12.5px] font-medium truncate leading-snug"
            style={{ color: 'var(--app-text)', letterSpacing: '-0.01em' }}
          >
            {note.icon && <span className="mr-1">{note.icon}</span>}
            {title}
          </span>

          {/* 미리보기 */}
          {preview && (
            <span
              className="text-[11px] truncate leading-snug"
              style={{ color: 'var(--app-text-dim)' }}
            >
              {preview}
            </span>
          )}

          {/* 메타데이터: 태그 + 윈도우 인디케이터 + 날짜 */}
          <div className="flex items-center gap-1.5 mt-0.5">
            {noteTags.map((tag) => (
              <span
                key={tag.id}
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tag.color }}
                title={tag.name}
              />
            ))}
            {isWindowOpen && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'rgba(99,102,241,0.6)' }}
                title="팝업 열림"
              />
            )}
            <span
              className="text-[10px] ml-auto tabular-nums flex-shrink-0"
              style={{ color: 'var(--app-text-dim)', opacity: 0.75 }}
            >
              {formatDate(note.updatedAt)}
            </span>
          </div>
        </div>
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
