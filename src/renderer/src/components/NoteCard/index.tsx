import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Note } from '../../../../shared/types'
import { useNoteStore } from '../../store/noteStore'
import { useTagStore } from '../../store/tagStore'
import { useFolderStore } from '../../store/folderStore'
import { useCustomEmojiStore } from '../../store/customEmojiStore'

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
  searchQuery?: string
}

// 전체 텍스트에서 검색어 주변 스니펫 추출
function getSearchSnippet(content: string, query: string): string {
  if (!content || !query) return ''
  try {
    const parsed = JSON.parse(content)
    const lines: string[] = []
    parsed.content?.forEach((block: unknown) => {
      const parts: string[] = []
      const walk = (node: { text?: string; content?: unknown[] }): void => {
        if (node.text) parts.push(node.text)
        node.content?.forEach((c) => walk(c as typeof node))
      }
      walk(block as { text?: string; content?: unknown[] })
      const line = parts.join('').trim()
      if (line) lines.push(line)
    })
    const q = query.toLowerCase()
    // 매칭되는 첫 번째 라인 찾기 (제목 제외, 2번째 줄부터)
    for (let i = 1; i < lines.length; i++) {
      const idx = lines[i].toLowerCase().indexOf(q)
      if (idx >= 0) {
        const start = Math.max(0, idx - 15)
        const end = Math.min(lines[i].length, idx + query.length + 30)
        return (start > 0 ? '...' : '') + lines[i].slice(start, end) + (end < lines[i].length ? '...' : '')
      }
    }
    // 제목에서만 매칭된 경우 기본 미리보기
    return lines.slice(1).join(' ').trim().slice(0, 80)
  } catch { return '' }
}

// 텍스트에서 검색어 하이라이트 JSX 생성
function highlight(text: string, query: string): JSX.Element {
  if (!query) return <>{text}</>
  const q = query.toLowerCase()
  const idx = text.toLowerCase().indexOf(q)
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(99,102,241,0.3)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
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
  const moveRowRef = useRef<HTMLButtonElement>(null)
  const subMenuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ top: y, left: x })
  const [subPos, setSubPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        (!subMenuRef.current || !subMenuRef.current.contains(e.target as Node))
      ) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // 메인 메뉴 뷰포트 경계 반전
  useLayoutEffect(() => {
    if (!ref.current) return
    const { offsetHeight, offsetWidth } = ref.current
    const top = y + offsetHeight > window.innerHeight - 8 ? y - offsetHeight : y
    const left = x + offsetWidth > window.innerWidth - 8 ? x - offsetWidth : x
    setPos({ top: Math.max(8, top), left: Math.max(8, left) })
  }, [x, y])

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
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover; setSubPos(null) }}
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

  const handleMoveRowEnter = (): void => {
    if (!moveRowRef.current) return
    const rect = moveRowRef.current.getBoundingClientRect()
    const subW = 160
    // 오른쪽에 공간 있으면 오른쪽, 없으면 왼쪽
    const left = rect.right + subW > window.innerWidth - 8 ? rect.left - subW : rect.right
    // 위아래 경계 보정
    const estimatedH = (folders.length + 1) * 28 + 12
    const top = Math.min(rect.top, window.innerHeight - estimatedH - 8)
    setSubPos({ top: Math.max(8, top), left })
  }

  // 폴더 계층 렌더링 (재귀)
  const renderFolderItems = (parentId: string | null, depth: number): JSX.Element[] => {
    return folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .flatMap((folder) => [
        <button
          key={folder.id}
          onMouseDown={(e) => { e.stopPropagation(); void handleMoveToFolder(folder.id) }}
          className="flex items-center w-full px-2 py-1.5 text-left text-xs transition-colors rounded-md"
          style={{ color: menuText, paddingLeft: `${8 + depth * 12}px` }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
        >
          <span className="text-[9px] w-3 mr-1.5 flex-shrink-0 text-center">
            {currentFolderId === folder.id ? '✓' : ''}
          </span>
          <span className="truncate">{folder.name}</span>
        </button>,
        ...renderFolderItems(folder.id, depth + 1),
      ])
  }

  return (
    <>
      <div
        ref={ref}
        className="fixed z-[9999] py-1.5 rounded-xl shadow-2xl"
        style={{
          left: pos.left, top: pos.top, minWidth: 168,
          backgroundColor: menuBg,
          border: `1px solid ${menuBorder}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="px-1">
          {item('노트 팝업', async () => { await toggleNoteWindow(noteId); onClose() }, undefined, isWindowOpen)}
          {sep()}
          {item('메모 복제', async () => { await duplicateNote(noteId); onClose() })}

          {/* 폴더로 이동 — 호버 시 사이드 서브메뉴 */}
          <button
            ref={moveRowRef}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors rounded-md"
            style={{ color: menuText }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover; handleMoveRowEnter() }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            <span className="w-3 flex-shrink-0" />
            폴더로 이동
            <span className="ml-auto text-[10px]" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.28)' }}>▸</span>
          </button>

          {sep()}
          {item('메모 삭제', async () => { await deleteNote(noteId); onClose() }, destructive)}
        </div>
      </div>

      {/* 폴더 서브메뉴 — Portal */}
      {subPos && createPortal(
        <div
          ref={subMenuRef}
          className="fixed z-[10000] py-1.5 rounded-xl shadow-2xl"
          style={{
            left: subPos.left, top: subPos.top, minWidth: 160,
            backgroundColor: menuBg,
            border: `1px solid ${menuBorder}`,
            backdropFilter: 'blur(12px)',
          }}
          onMouseEnter={() => { /* 서브메뉴 위에 있는 동안 유지 */ }}
          onMouseLeave={() => setSubPos(null)}
        >
          <div className="px-1">
            {/* 미분류 */}
            <button
              onMouseDown={(e) => { e.stopPropagation(); void handleMoveToFolder(null) }}
              className="flex items-center w-full px-2 py-1.5 text-left text-xs transition-colors rounded-md"
              style={{ color: menuText }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              <span className="text-[9px] w-3 mr-1.5 flex-shrink-0 text-center">{currentFolderId === null ? '✓' : ''}</span>
              <span>미분류</span>
            </button>
            {folders.length > 0 && <div style={{ height: 1, margin: '3px 8px', backgroundColor: menuBorder }} />}
            {renderFolderItems(null, 0)}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export function NoteCard({ note, isDark = true, indent = false, selectionMode = false, selected = false, onToggleSelect, searchQuery = '' }: Props): JSX.Element {
  const { selectedId, setSelectedId, openWindowIds, toggleNoteWindow } = useNoteStore()
  const { tags, noteTagMap } = useTagStore()
  const { emojis: customEmojis } = useCustomEmojiStore()
  const isSelected = !selectionMode && selectedId === note.id
  const isWindowOpen = openWindowIds.has(note.id)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)
  const noteTags = (noteTagMap[note.id] ?? [])
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean) as typeof tags

  const title = getTitle(note.content)
  const preview = searchQuery ? getSearchSnippet(note.content, searchQuery) : getPreview(note.content)

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

  const handleDoubleClick = (): void => {
    if (!selectionMode) toggleNoteWindow(note.id)
  }

  const isHighlighted = isSelected || (selectionMode && selected)

  return (
    <>
      <div
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
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
            className="flex items-center gap-1.5 text-[12.5px] font-medium truncate leading-snug"
            style={{ color: 'var(--app-text)', letterSpacing: '-0.01em' }}
          >
            {note.icon && (
              note.icon.startsWith('custom:')
                ? (() => {
                    const ce = customEmojis.find(e => e.id === note.icon!.slice(7))
                    return ce ? <img src={`file://${ce.path}`} alt={ce.name} className="w-4 h-4 object-contain flex-shrink-0" /> : null
                  })()
                : <span className="flex-shrink-0">{note.icon}</span>
            )}
            {!note.content ? (
              <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">N</span>
            ) : null}
            <span className="truncate">{searchQuery ? highlight(title, searchQuery) : title}</span>
          </span>

          {/* 미리보기 */}
          {preview && (
            <span
              className="text-[11px] truncate leading-snug"
              style={{ color: 'var(--app-text-dim)' }}
            >
              {searchQuery ? highlight(preview, searchQuery) : preview}
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
