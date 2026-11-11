import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style'
import { Highlight } from '@tiptap/extension-highlight'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { Details, DetailsContent, DetailsSummary } from '@tiptap/extension-details'
import { common, createLowlight } from 'lowlight'
import { useNoteStore } from '../../store/noteStore'
import { useSettingsStore } from '../../store/settingsStore'
import { useFolderStore } from '../../store/folderStore'
import { useTagStore } from '../../store/tagStore'
import { NoteCard } from '../NoteCard'
import { Toolbar } from '../Toolbar'
import { SettingsPanel } from '../SettingsPanel'
import { Callout } from '../../extensions/Callout'
import { SlashCommand } from '../../extensions/SlashCommand'
import { Mention, MentionNode } from '../../extensions/Mention'
import { DragHandle } from '../../extensions/DragHandle'
import type { Note, SortBy } from '../../../../shared/types'

const lowlight = createLowlight(common)

// ── 인라인 에디터 ──────────────────────────────────────────────
function InlineEditor({ isDark }: { isDark: boolean }): JSX.Element | null {
  const { notes, selectedId, updateNote, setSelectedId } = useNoteStore()
  const { spellCheck } = useSettingsStore()
  const note = notes.find((n) => n.id === selectedId) ?? null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: '메모를 입력하세요...' }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Details,
      DetailsContent,
      DetailsSummary,
      Callout,
      SlashCommand,
      MentionNode,
      Mention.configure({
        onNavigate: (id) => { setSelectedId(id) },
      }),
      DragHandle,
    ],
    content: note?.content ? JSON.parse(note.content) : '',
    onUpdate: ({ editor }) => {
      if (!selectedId) return
      updateNote(selectedId, { content: JSON.stringify(editor.getJSON()) })
    },
  })

  useEffect(() => {
    if (!editor || !note) return
    const incoming = note.content ? JSON.parse(note.content) : ''
    editor.commands.setContent(incoming, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  if (!note) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm" style={{ color: 'var(--app-text-dim)' }}>
          메모를 선택하세요
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      <div className="h-7 flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
      <div
        className={`${isDark ? 'dark-editor' : ''} flex-1 overflow-y-auto px-6 py-4 text-sm`}
        style={{ color: 'var(--app-text)' }}
      >
        <EditorContent editor={editor} className="tiptap h-full" spellCheck={spellCheck} />
      </div>
      <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--app-border)' }}>
        <Toolbar editor={editor} dark={isDark} />
      </div>
    </div>
  )
}

// ── 정렬 드롭다운 ──────────────────────────────────────────────
const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'updatedAt', label: '최근 수정순' },
  { value: 'createdAt', label: '최근 생성순' },
  { value: 'color',     label: '색상별' },
  { value: 'manual',   label: '직접 정렬' },
]

function SortDropdown({ sortBy, onChange }: { sortBy: SortBy; onChange: (s: SortBy) => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="transition-opacity hover:opacity-80"
        style={{ color: 'var(--app-text-muted)', WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title="정렬"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M2 4h11M4 7.5h7M6 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 rounded-lg shadow-xl border z-50 overflow-hidden min-w-[120px]"
          style={{ backgroundColor: 'var(--app-sidebar)', borderColor: 'var(--app-border)' }}
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="flex items-center justify-between w-full px-3 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: sortBy === opt.value ? 'var(--app-active)' : 'transparent',
                color: sortBy === opt.value ? 'var(--app-text)' : 'var(--app-text-muted)',
              }}
            >
              {opt.label}
              {sortBy === opt.value && <span style={{ color: 'var(--app-text-muted)' }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 태그 필터 / 관리 ───────────────────────────────────────────
const TAG_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#6b7280']

function TagSection({ isDark }: { isDark: boolean }): JSX.Element {
  const { tags, selectedTagId, selectTag, createTag, deleteTag, load } = useTagStore()
  const [addingTag, setAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[4])

  useEffect(() => { load() }, [load])

  const handleAddTag = async (): Promise<void> => {
    const name = newTagName.trim()
    if (!name) return
    await createTag(name, newTagColor)
    setNewTagName('')
    setAddingTag(false)
  }

  return (
    <div className="border-t px-2 py-2 flex-shrink-0" style={{ borderColor: 'var(--app-border)' }}>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => selectTag(selectedTagId === tag.id ? null : tag.id)}
              className="group flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all"
              style={{
                backgroundColor: selectedTagId === tag.id ? tag.color : `${tag.color}22`,
                color: selectedTagId === tag.id ? '#fff' : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'),
                border: `1px solid ${tag.color}66`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
              {tag.name}
              <span
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 ml-0.5"
                onMouseDown={(e) => { e.stopPropagation(); deleteTag(tag.id) }}
              >×</span>
            </button>
          ))}
        </div>
      )}
      {addingTag ? (
        <div className="flex flex-col gap-1">
          <input
            autoFocus
            className="w-full px-2 py-0.5 text-xs rounded outline-none"
            style={{ backgroundColor: 'var(--app-hover)', color: 'var(--app-text)' }}
            placeholder="태그 이름..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTag()
              if (e.key === 'Escape') setAddingTag(false)
            }}
          />
          <div className="flex gap-1 flex-wrap">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewTagColor(c)}
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: c, outline: newTagColor === c ? `2px solid ${c}` : 'none', outlineOffset: 1 }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              className="flex-1 text-[10px] py-0.5 rounded"
              style={{ backgroundColor: 'var(--app-active)', color: 'var(--app-text)' }}
              onClick={handleAddTag}
            >추가</button>
            <button
              className="text-[10px] py-0.5 px-2 rounded"
              style={{ color: 'var(--app-text-muted)' }}
              onClick={() => setAddingTag(false)}
            >취소</button>
          </div>
        </div>
      ) : (
        <button
          className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-80"
          style={{ color: 'var(--app-text-dim)' }}
          onClick={() => setAddingTag(true)}
        >
          + 태그 추가
        </button>
      )}
    </div>
  )
}

// ── 사이드바 트리 ─────────────────────────────────────────────
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
    return texts.join(' ').trim() || '메모'
  } catch { return '메모' }
}

function sortNotes(notes: Note[], sortBy: SortBy): Note[] {
  const sorted = [...notes]
  if (sortBy === 'updatedAt') sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  else if (sortBy === 'createdAt') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  else if (sortBy === 'color') {
    const ORDER = ['yellow', 'blue', 'green', 'pink', 'purple', 'white']
    sorted.sort((a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color))
  } else if (sortBy === 'manual') {
    sorted.sort((a, b) => a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : b.createdAt.localeCompare(a.createdAt))
  }
  return sorted
}

function NoteReorderWrapper({
  note, isDark, selectionMode, selected, onToggleSelect, onDropOnNote,
}: {
  note: Note
  isDark: boolean
  selectionMode: boolean
  selected: boolean
  onToggleSelect: () => void
  onDropOnNote?: (draggedId: string, targetId: string, before: boolean) => void
}): JSX.Element {
  const [indicator, setIndicator] = useState<'before' | 'after' | null>(null)
  return (
    <div
      style={{ position: 'relative' }}
      onDragOver={(e) => {
        // Only intercept NOTE drags — let folder drags pass through to TreeSection
        if (!e.dataTransfer.types.includes('noteid')) return
        e.preventDefault()
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        setIndicator(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after')
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIndicator(null)
      }}
      onDrop={(e) => {
        if (e.dataTransfer.getData('dragtype') !== 'note') return  // let folder drops bubble up
        e.preventDefault()
        e.stopPropagation()
        const draggedId = e.dataTransfer.getData('noteid')
        if (draggedId && draggedId !== note.id) onDropOnNote?.(draggedId, note.id, indicator === 'before')
        setIndicator(null)
      }}
    >
      {indicator === 'before' && (
        <div className="absolute top-0 left-0 right-0 h-0.5 z-10 pointer-events-none" style={{ backgroundColor: 'rgba(99,102,241,0.8)' }} />
      )}
      <NoteCard
        note={note}
        isDark={isDark}
        indent
        selectionMode={selectionMode}
        selected={selected}
        onToggleSelect={onToggleSelect}
      />
      {indicator === 'after' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 z-10 pointer-events-none" style={{ backgroundColor: 'rgba(99,102,241,0.8)' }} />
      )}
    </div>
  )
}

interface SelectionState {
  sectionId: string
  selected: Set<string>
}

interface FolderCtxMenuProps {
  x: number
  y: number
  folderId: string | null
  folderIdx: number
  folderCount: number
  isDark: boolean
  onClose: () => void
  onRename: () => void
  onDelete: () => void
  onNewNote: () => void
  onNewFolder: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onSelectDelete: () => void
}

function FolderContextMenu({
  x, y, folderId, folderIdx, folderCount, isDark, onClose,
  onRename, onDelete, onNewNote, onNewFolder, onDuplicate, onMoveUp, onMoveDown, onSelectDelete,
}: FolderCtxMenuProps): JSX.Element {
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
  const dimmed = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'

  const item = (label: string, onClick: () => void, color?: string, disabled?: boolean): JSX.Element => (
    <button
      onMouseDown={(e) => { if (disabled) return; e.stopPropagation(); onClick() }}
      className="flex items-center gap-2 w-full px-3 py-1.5 text-left text-xs transition-colors rounded"
      style={{ color: disabled ? dimmed : (color ?? menuText), cursor: disabled ? 'not-allowed' : 'pointer' }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = menuHover }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
    >
      {label}
    </button>
  )

  const sep = (): JSX.Element => (
    <div style={{ height: 1, margin: '2px 8px', backgroundColor: menuBorder }} />
  )

  const isUncategorized = folderId === null

  return (
    <div
      ref={ref}
      className="fixed z-[9999] py-1 rounded-lg shadow-xl"
      style={{ left: x, top: y, minWidth: 170, backgroundColor: menuBg, border: `1px solid ${menuBorder}` }}
    >
      {item('새 메모 추가', () => { onNewNote(); onClose() })}
      {sep()}
      {item('새 폴더 만들기', () => { onNewFolder(); onClose() })}
      {!isUncategorized && item('폴더 복제', () => { onDuplicate(); onClose() })}
      {sep()}
      {!isUncategorized && item('이름 변경', () => { onRename(); onClose() })}
      {!isUncategorized && item('위로 이동', () => { onMoveUp(); onClose() }, undefined, folderIdx <= 0)}
      {!isUncategorized && item('아래로 이동', () => { onMoveDown(); onClose() }, undefined, folderIdx >= folderCount - 1)}
      {sep()}
      {item('메모 선택 삭제...', () => { onSelectDelete(); onClose() })}
      {!isUncategorized && sep()}
      {!isUncategorized && item('폴더 삭제', () => { onDelete(); onClose() }, destructive)}
    </div>
  )
}

interface TreeSectionProps {
  sectionId: string
  icon: string
  label: string
  notes: Note[]
  expanded: boolean
  isDark: boolean
  depth?: number
  onToggle: () => void
  onNewNote: () => void
  onRename?: () => void
  onDelete?: () => void
  renamingContent?: JSX.Element
  onDropNote?: (noteId: string) => void
  onDropFolder?: (folderId: string) => void
  onNestFolder?: (folderId: string) => void
  draggableFolder?: boolean
  onFolderDragStart?: (e: React.DragEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
  selectionState?: SelectionState | null
  onToggleNoteSelect?: (noteId: string) => void
  onDeleteSelected?: () => void
  onCancelSelection?: () => void
  onNoteDropOnNote?: (draggedId: string, targetId: string, before: boolean) => void
  subContent?: React.ReactNode
}

function TreeSection({
  sectionId, icon, label, notes, expanded, isDark, depth = 0,
  onToggle, onNewNote, onDelete, onRename, renamingContent,
  onDropNote, onDropFolder, onNestFolder, draggableFolder, onFolderDragStart,
  onContextMenu, selectionState, onToggleNoteSelect, onDeleteSelected, onCancelSelection,
  onNoteDropOnNote, subContent,
}: TreeSectionProps): JSX.Element {
  const isSelecting = selectionState?.sectionId === sectionId
  const selectedCount = isSelecting ? selectionState!.selected.size : 0
  const [bodyDropOver, setBodyDropOver] = useState(false)
  const [headerFolderIndicator, setHeaderFolderIndicator] = useState<'reorder' | 'nest' | null>(null)

  // Outer body: accepts note drops (move to folder) + folder drops in body (nest inside)
  const handleBodyDragOver = (e: React.DragEvent): void => {
    if (e.dataTransfer.types.includes('dragtype')) {
      e.preventDefault()
      setBodyDropOver(true)
    }
  }
  const handleBodyDragLeave = (e: React.DragEvent): void => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setBodyDropOver(false)
  }
  const handleBodyDrop = (e: React.DragEvent): void => {
    setBodyDropOver(false)
    const type = e.dataTransfer.getData('dragtype')
    if (type === 'note') {
      e.preventDefault()
      const noteId = e.dataTransfer.getData('noteid')
      if (noteId) onDropNote?.(noteId)
    } else if (type === 'folder') {
      e.preventDefault()
      const folderId = e.dataTransfer.getData('folderid')
      if (folderId && folderId !== sectionId) onNestFolder?.(folderId)
    }
  }

  // Header: accepts folder drops — top 40% = reorder, bottom 60% = nest
  const handleHeaderDragOver = (e: React.DragEvent): void => {
    if (!e.dataTransfer.types.includes('folderid')) return
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setHeaderFolderIndicator(e.clientY < rect.top + rect.height * 0.4 ? 'reorder' : 'nest')
  }
  const handleHeaderDragLeave = (e: React.DragEvent): void => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeaderFolderIndicator(null)
  }
  const handleHeaderDrop = (e: React.DragEvent): void => {
    if (e.dataTransfer.getData('dragtype') !== 'folder') return
    e.preventDefault()
    e.stopPropagation()
    setHeaderFolderIndicator(null)
    const folderId = e.dataTransfer.getData('folderid')
    if (!folderId || folderId === sectionId) return
    const rect = e.currentTarget.getBoundingClientRect()
    const isReorder = e.clientY < rect.top + rect.height * 0.4
    if (isReorder) onDropFolder?.(folderId)
    else onNestFolder?.(folderId)
  }

  const nestHighlight = headerFolderIndicator === 'nest'
  const bodyHighlight = bodyDropOver

  return (
    <div
      style={{ marginLeft: depth * 10 }}
      onDragOver={handleBodyDragOver}
      onDragLeave={handleBodyDragLeave}
      onDrop={handleBodyDrop}
    >
      {/* 섹션 헤더 — folder drop indicator line above on reorder */}
      {headerFolderIndicator === 'reorder' && (
        <div className="h-0.5 pointer-events-none" style={{ backgroundColor: 'rgba(99,102,241,0.8)' }} />
      )}
      <div
        className="group flex items-center w-full border-b transition-colors relative"
        style={{
          borderColor: 'var(--app-border)',
          backgroundColor: nestHighlight || bodyHighlight
            ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)')
            : 'transparent',
          outline: nestHighlight
            ? `2px solid ${isDark ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.5)'}`
            : (bodyHighlight ? `1px dashed ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}` : 'none'),
          outlineOffset: -1,
        }}
        onContextMenu={onContextMenu}
        onDragOver={handleHeaderDragOver}
        onDragLeave={handleHeaderDragLeave}
        onDrop={handleHeaderDrop}
      >
        {renamingContent ?? (
          <button
            className="flex items-center gap-1.5 flex-1 py-1.5 text-xs text-left min-w-0"
            style={{ paddingLeft: 8, color: 'var(--app-text-muted)' }}
            onClick={onToggle}
            draggable={draggableFolder}
            onDragStart={draggableFolder ? onFolderDragStart : undefined}
          >
            <span
              className="text-[7px] flex-shrink-0 transition-transform duration-150"
              style={{ transform: expanded ? 'rotate(90deg)' : 'none', color: 'var(--app-text-dim)' }}
            >▶</span>
            <span className="flex-shrink-0">{nestHighlight ? '📂' : icon}</span>
            <span className="flex-1 truncate font-medium text-[11px]">{label}</span>
            <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--app-text-dim)' }}>{notes.length}</span>
          </button>
        )}
        <div
          className="opacity-0 group-hover:opacity-100 flex items-center pr-1.5 gap-0.5 flex-shrink-0 transition-opacity"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onNewNote() }}
            className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 text-sm leading-none"
            style={{ color: 'var(--app-text-dim)' }}
            title="이 폴더에 메모 추가"
          >+</button>
          {onRename && (
            <button
              onClick={(e) => { e.stopPropagation(); onRename() }}
              className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 text-[10px]"
              style={{ color: 'var(--app-text-dim)' }}
              title="이름 변경"
            >✎</button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 text-[10px]"
              style={{ color: 'var(--app-text-dim)' }}
              title="폴더 삭제"
            >×</button>
          )}
        </div>
      </div>

      {/* 선택 모드 바 */}
      {isSelecting && (
        <div
          className="flex items-center gap-1.5 px-2 py-1 border-b w-full text-[10px]"
          style={{ borderColor: 'var(--app-border)', backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)' }}
        >
          <span style={{ color: 'var(--app-text-muted)', flex: 1 }}>{selectedCount}개 선택됨</span>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onDeleteSelected?.() }}
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ backgroundColor: '#f87171', color: '#fff', opacity: selectedCount === 0 ? 0.4 : 1 }}
          >삭제</button>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onCancelSelection?.() }}
            className="px-1.5 py-0.5 rounded text-[10px]"
            style={{ color: 'var(--app-text-muted)', backgroundColor: 'var(--app-hover)' }}
          >취소</button>
        </div>
      )}

      {/* 메모 목록 + 하위 폴더 */}
      {expanded && (
        <div>
          {notes.length === 0 && !subContent ? (
            <div className="pl-6 py-2 text-[10px]" style={{ color: 'var(--app-text-dim)' }}>
              메모 없음
            </div>
          ) : (
            notes.map((note) => (
              <NoteReorderWrapper
                key={note.id}
                note={note}
                isDark={isDark}
                selectionMode={isSelecting}
                selected={isSelecting && selectionState!.selected.has(note.id)}
                onToggleSelect={() => onToggleNoteSelect?.(note.id)}
                onDropOnNote={onNoteDropOnNote}
              />
            ))
          )}
          {subContent}
        </div>
      )}
    </div>
  )
}

// ── 사이드바 트리 전체 ─────────────────────────────────────────
function SidebarTree({
  searchQuery,
  sortBy,
  setSortBy,
  isDark,
  addFolderTrigger,
  onAddFolderTriggered,
}: {
  searchQuery: string
  sortBy: SortBy
  setSortBy: (s: SortBy) => void
  isDark: boolean
  addFolderTrigger: boolean
  onAddFolderTriggered: () => void
}): JSX.Element {
  const { notes, createNote, updateNote, deleteNote, reorderNotes } = useNoteStore()
  const { folders, load, createFolder, renameFolder, deleteFolder, duplicateFolder, nestFolder, reorderFolders, moveFolder } = useFolderStore()
  const { selectedTagId, noteTagMap, loadNoteTagIds } = useTagStore()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['uncategorized']))
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; sectionId: string | null } | null>(null)
  const [selectionState, setSelectionState] = useState<SelectionState | null>(null)

  useEffect(() => { load() }, [load])

  useEffect(() => {
    notes.forEach((n) => { if (!noteTagMap[n.id]) loadNoteTagIds(n.id) })
  }, [notes, noteTagMap, loadNoteTagIds])

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // 태그 + 검색 필터
  const filtered = useMemo(() => {
    let ns = [...notes]
    if (selectedTagId) {
      ns = ns.filter((n) => (noteTagMap[n.id] ?? []).includes(selectedTagId))
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      ns = ns.filter((n) => {
        try {
          const parsed = JSON.parse(n.content)
          const texts: string[] = []
          const walk = (node: { text?: string; content?: unknown[] }): void => {
            if (node.text) texts.push(node.text)
            node.content?.forEach((c) => walk(c as typeof node))
          }
          parsed.content?.forEach((nd: unknown) => walk(nd as { text?: string; content?: unknown[] }))
          return texts.join(' ').toLowerCase().includes(q)
        } catch { return n.content.toLowerCase().includes(q) }
      })
    }
    return ns
  }, [notes, selectedTagId, noteTagMap, searchQuery])

  const uncategorized = useMemo(() => sortNotes(filtered.filter((n) => !n.folderId), sortBy), [filtered, sortBy])
  const folderNotes = useCallback(
    (folderId: string) => sortNotes(filtered.filter((n) => n.folderId === folderId), sortBy),
    [filtered, sortBy]
  )

  // 검색 중이면 자동으로 모든 섹션 펼치기
  useEffect(() => {
    if (searchQuery.trim()) {
      const ids = new Set(['uncategorized', ...folders.map((f) => f.id)])
      setExpandedIds(ids)
    }
  }, [searchQuery, folders])

  const handleFolderDragStart = useCallback((folderId: string) => (e: React.DragEvent): void => {
    e.dataTransfer.setData('dragtype', 'folder')
    e.dataTransfer.setData('folderid', folderId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingFolderId(folderId)
  }, [])

  // Global dragend to clear folder drag state
  useEffect(() => {
    const handler = (): void => { setDraggingFolderId(null) }
    document.addEventListener('dragend', handler)
    return () => document.removeEventListener('dragend', handler)
  }, [])

  const handleAddFolder = async (): Promise<void> => {
    const name = newFolderName.trim()
    if (!name) return
    const folder = await createFolder(name)
    setNewFolderName('')
    setAddingFolder(false)
    setExpandedIds((prev) => new Set([...prev, folder.id]))
  }

  const handleRename = async (id: string): Promise<void> => {
    const name = renameValue.trim()
    if (name) await renameFolder(id, name)
    setRenamingId(null)
  }

  useEffect(() => {
    if (addFolderTrigger) {
      setAddingFolder(true)
      onAddFolderTriggered()
    }
  }, [addFolderTrigger, onAddFolderTriggered])

  const handleNoteDropOnNote = useCallback((sectionId: string, draggedId: string, targetId: string, before: boolean) => {
    const targetFolderId = sectionId === 'uncategorized' ? null : sectionId
    const draggedNote = notes.find((n) => n.id === draggedId)
    if (!draggedNote) return
    const sectionNotes = [...notes.filter((n) => n.folderId === targetFolderId)]
    sectionNotes.sort((a, b) => a.sortOrder - b.sortOrder)
    const withoutDragged = sectionNotes.filter((n) => n.id !== draggedId)
    const targetIdx = withoutDragged.findIndex((n) => n.id === targetId)
    if (targetIdx === -1) return
    const insertIdx = before ? targetIdx : targetIdx + 1
    const newOrder = [...withoutDragged.slice(0, insertIdx), draggedNote, ...withoutDragged.slice(insertIdx)]
    if (draggedNote.folderId !== targetFolderId) {
      void updateNote(draggedId, { folderId: targetFolderId })
    }
    void reorderNotes(newOrder.map((n, i) => ({ id: n.id, sortOrder: i })))
    setSortBy('manual')
  }, [notes, updateNote, reorderNotes, setSortBy])

  const handleContextMenu = useCallback((e: React.MouseEvent, sectionId: string | null) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, sectionId })
  }, [])

  const handleToggleNoteSelect = useCallback((noteId: string) => {
    setSelectionState((prev) => {
      if (!prev) return prev
      const next = new Set(prev.selected)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return { ...prev, selected: next }
    })
  }, [])

  const handleDeleteSelected = useCallback(async () => {
    if (!selectionState || selectionState.selected.size === 0) return
    for (const id of selectionState.selected) {
      await deleteNote(id)
    }
    setSelectionState(null)
  }, [selectionState, deleteNote])

  // Recursive folder renderer
  function renderFolder(folder: typeof folders[0], depth: number): JSX.Element {
    const isRenaming = renamingId === folder.id
    const childFolders = folders
      .filter((f) => f.parentId === folder.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return (
      <TreeSection
        key={folder.id}
        sectionId={folder.id}
        icon="📁"
        label={folder.name}
        notes={folderNotes(folder.id)}
        expanded={expandedIds.has(folder.id)}
        isDark={isDark}
        depth={depth}
        onToggle={() => toggle(folder.id)}
        onNewNote={() => { createNote({ folderId: folder.id }); setExpandedIds((p) => new Set([...p, folder.id])) }}
        onRename={() => { setRenamingId(folder.id); setRenameValue(folder.name) }}
        onDelete={() => deleteFolder(folder.id)}
        onDropNote={(noteId) => { updateNote(noteId, { folderId: folder.id }) }}
        onDropFolder={(draggedId) => { void reorderFolders(draggedId, folder.id) }}
        onNestFolder={(draggedId) => { void nestFolder(draggedId, folder.id) }}
        draggableFolder
        onFolderDragStart={handleFolderDragStart(folder.id)}
        onContextMenu={(e) => handleContextMenu(e, folder.id)}
        selectionState={selectionState}
        onToggleNoteSelect={handleToggleNoteSelect}
        onDeleteSelected={handleDeleteSelected}
        onCancelSelection={() => setSelectionState(null)}
        onNoteDropOnNote={(dId, tId, before) => handleNoteDropOnNote(folder.id, dId, tId, before)}
        renamingContent={isRenaming ? (
          <input
            autoFocus
            className="flex-1 mx-2 my-1 px-2 py-0.5 text-xs rounded outline-none"
            style={{ backgroundColor: 'var(--app-hover)', color: 'var(--app-text)' }}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => handleRename(folder.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename(folder.id)
              if (e.key === 'Escape') setRenamingId(null)
            }}
          />
        ) : undefined}
        subContent={childFolders.length > 0
          ? <div>{childFolders.map((child) => renderFolder(child, depth + 1))}</div>
          : undefined}
      />
    )
  }

  const topLevelFolders = folders
    .filter((f) => !f.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex-1 overflow-y-auto sidebar-list">
      {/* 미분류 */}
      <TreeSection
        sectionId="uncategorized"
        icon="📄"
        label="미분류"
        notes={uncategorized}
        expanded={expandedIds.has('uncategorized')}
        isDark={isDark}
        onToggle={() => toggle('uncategorized')}
        onNewNote={() => { createNote({ folderId: null }); setExpandedIds((p) => new Set([...p, 'uncategorized'])) }}
        onDropNote={(noteId) => { updateNote(noteId, { folderId: null }) }}
        onContextMenu={(e) => handleContextMenu(e, null)}
        selectionState={selectionState}
        onToggleNoteSelect={handleToggleNoteSelect}
        onDeleteSelected={handleDeleteSelected}
        onCancelSelection={() => setSelectionState(null)}
        onNoteDropOnNote={(dId, tId, before) => handleNoteDropOnNote('uncategorized', dId, tId, before)}
      />

      {/* 사용자 폴더 (재귀적) */}
      {topLevelFolders.map((folder) => renderFolder(folder, 0))}

      {/* 컨텍스트 메뉴 */}
      {ctxMenu && (
        <FolderContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          folderId={ctxMenu.sectionId}
          folderIdx={(() => {
            if (!ctxMenu.sectionId) return -1
            const f = folders.find((f) => f.id === ctxMenu.sectionId)
            const siblings = folders.filter((s) => s.parentId === (f?.parentId ?? null)).sort((a,b) => a.sortOrder - b.sortOrder)
            return siblings.findIndex((s) => s.id === ctxMenu.sectionId)
          })()}
          folderCount={(() => {
            if (!ctxMenu.sectionId) return 0
            const f = folders.find((f) => f.id === ctxMenu.sectionId)
            return folders.filter((s) => s.parentId === (f?.parentId ?? null)).length
          })()}
          isDark={isDark}
          onClose={() => setCtxMenu(null)}
          onNewNote={() => {
            const fId = ctxMenu.sectionId
            createNote({ folderId: fId })
            setExpandedIds((p) => new Set([...p, fId ?? 'uncategorized']))
          }}
          onNewFolder={() => setAddingFolder(true)}
          onRename={() => {
            if (ctxMenu.sectionId) { setRenamingId(ctxMenu.sectionId); setRenameValue(folders.find((f) => f.id === ctxMenu.sectionId)?.name ?? '') }
          }}
          onDelete={() => { if (ctxMenu.sectionId) deleteFolder(ctxMenu.sectionId) }}
          onDuplicate={() => { if (ctxMenu.sectionId) void duplicateFolder(ctxMenu.sectionId) }}
          onMoveUp={() => { if (ctxMenu.sectionId) void moveFolder(ctxMenu.sectionId, 'up') }}
          onMoveDown={() => { if (ctxMenu.sectionId) void moveFolder(ctxMenu.sectionId, 'down') }}
          onSelectDelete={() => setSelectionState({ sectionId: ctxMenu.sectionId ?? 'uncategorized', selected: new Set() })}
        />
      )}

      {/* 폴더 추가 */}
      {addingFolder ? (
        <div className="px-2 py-1.5 border-b" style={{ borderColor: 'var(--app-border)' }}>
          <input
            autoFocus
            className="w-full px-2 py-0.5 text-xs rounded outline-none"
            style={{ backgroundColor: 'var(--app-hover)', color: 'var(--app-text)' }}
            placeholder="폴더 이름..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => { if (!newFolderName.trim()) setAddingFolder(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder()
              if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName('') }
            }}
          />
        </div>
      ) : (
        <button
          className="flex items-center gap-1 w-full px-3 py-1.5 text-[10px] transition-opacity hover:opacity-80 border-b"
          style={{ color: 'var(--app-text-dim)', borderColor: 'var(--app-border)' }}
          onClick={() => setAddingFolder(true)}
        >
          + 폴더 추가
        </button>
      )}
    </div>
  )
}

// ── 메인 패널 ─────────────────────────────────────────────────
export function MainPanel(): JSX.Element {
  const { notes, isLoading, loadNotes, createNote, _addNote, _removeNote, setWindowOpen } = useNoteStore()
  const { themeMode, themeColor, loaded, load: loadSettings, shortcuts } = useSettingsStore()
  const isDark = themeMode === 'dark'

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt')
  const [showSettings, setShowSettings] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [addFolderTrigger, setAddFolderTrigger] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSettings()
    loadNotes()
    const offCreated = window.api.note.onCreated(_addNote)
    const offDeleted = window.api.note.onDeleted(_removeNote)
    const offWinOpened = window.api.note.onWindowOpened((id) => setWindowOpen(id, true))
    const offWinClosed = window.api.note.onWindowClosed((id) => setWindowOpen(id, false))
    return () => { offCreated(); offDeleted(); offWinOpened(); offWinClosed() }
  }, [loadNotes, _addNote, _removeNote, loadSettings, setWindowOpen])

  useEffect(() => {
    const matchShortcut = (e: KeyboardEvent, sc: typeof shortcuts.newNote): boolean =>
      e.key.toLowerCase() === sc.key.toLowerCase() &&
      e.metaKey === sc.meta &&
      e.ctrlKey === sc.ctrl &&
      e.shiftKey === sc.shift &&
      e.altKey === sc.alt

    const handler = (e: KeyboardEvent): void => {
      if (matchShortcut(e, shortcuts.newNote)) {
        e.preventDefault()
        createNote({})
      } else if (matchShortcut(e, shortcuts.searchFocus)) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (matchShortcut(e, shortcuts.openSettings)) {
        e.preventDefault()
        setShowSettings((v) => !v)
      } else if (matchShortcut(e, shortcuts.toggleSidebar)) {
        e.preventDefault()
        setShowSidebar((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts, createNote])

  if (!loaded) return <div className="flex h-screen" style={{ backgroundColor: 'var(--app-main)' }} />

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--app-main)' }}
      data-theme-mode={themeMode}
      data-theme-color={themeColor}
    >
      {/* ── 좌측 사이드바 ── */}
      {showSidebar && (
        <div
          className="flex flex-col w-[200px] flex-shrink-0 border-r"
          style={{ backgroundColor: 'var(--app-sidebar)', borderColor: 'var(--app-border)' }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-3 py-2.5 border-b flex-shrink-0"
            style={{ borderColor: 'var(--app-border)', WebkitAppRegion: 'drag' } as React.CSSProperties}
          >
            <SortDropdown sortBy={sortBy} onChange={setSortBy} />
            <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
              <button
                onClick={() => setShowSettings((v) => !v)}
                className="transition-opacity hover:opacity-80"
                style={{ color: showSettings ? 'var(--app-text)' : 'var(--app-text-muted)' }}
                title="설정"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.1 1.1M9.9 9.9l1.1 1.1M2.9 11.1l1.1-1.1M9.9 4.1l1.1-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                onClick={() => createNote({})}
                className="transition-opacity hover:opacity-80"
                style={{ color: 'var(--app-text-muted)' }}
                title="새 메모"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M11.5 1.5L13.5 3.5L5.5 11.5H3.5V9.5L11.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M2 13.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              <button
                onClick={() => setAddFolderTrigger(true)}
                className="transition-opacity hover:opacity-80"
                style={{ color: 'var(--app-text-muted)' }}
                title="새 폴더"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1.5 3.5h4l1.5 2h6.5v7H1.5v-9Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <path d="M7.5 7.5v3M6 9h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 검색창 */}
          <div className="px-2 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--app-border)' }}>
            <div className="relative flex items-center">
              <svg className="absolute left-2 pointer-events-none" width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ color: 'var(--app-text-dim)' }}>
                <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7.5 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색..."
                className="w-full text-xs rounded-md pl-6 pr-2 py-1 outline-none"
                style={{ backgroundColor: 'var(--app-hover)', color: 'var(--app-text)', caretColor: 'var(--app-text)' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-1.5 text-xs" style={{ color: 'var(--app-text-dim)' }}>
                  ×
                </button>
              )}
            </div>
          </div>

          {/* 트리 뷰 */}
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-xs flex-1" style={{ color: 'var(--app-text-dim)' }}>
              불러오는 중...
            </div>
          ) : (
            <SidebarTree
              searchQuery={searchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              isDark={isDark}
              addFolderTrigger={addFolderTrigger}
              onAddFolderTriggered={() => setAddFolderTrigger(false)}
            />
          )}

          {/* 태그 섹션 */}
          <TagSection isDark={isDark} />
        </div>
      )}

      {/* ── 우측 에디터 패널 ── */}
      <InlineEditor isDark={isDark} />

      {/* ── 설정 패널 오버레이 ── */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
