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
import type { Note, SortBy } from '../../../../shared/types'

const lowlight = createLowlight(common)

// ── 인라인 에디터 ──────────────────────────────────────────────
function InlineEditor({ isDark }: { isDark: boolean }): JSX.Element | null {
  const { notes, selectedId, updateNote } = useNoteStore()
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
      Mention,
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
  }
  return sorted
}

interface TreeSectionProps {
  sectionId: string
  icon: string
  label: string
  notes: Note[]
  expanded: boolean
  isDark: boolean
  onToggle: () => void
  onNewNote: () => void
  onRename?: () => void
  onDelete?: () => void
  renamingContent?: JSX.Element
  onDropNote?: (noteId: string) => void
  onDropFolder?: (folderId: string) => void
  draggableFolder?: boolean
  onFolderDragStart?: (e: React.DragEvent) => void
  folderDragOver?: boolean
}

function TreeSection({
  sectionId, icon, label, notes, expanded, isDark,
  onToggle, onNewNote, onDelete, onRename, renamingContent,
  onDropNote, onDropFolder, draggableFolder, onFolderDragStart, folderDragOver,
}: TreeSectionProps): JSX.Element {
  const [noteDropOver, setNoteDropOver] = useState(false)

  const handleDragOver = (e: React.DragEvent): void => {
    if (e.dataTransfer.types.includes('dragtype')) {
      e.preventDefault()
      e.stopPropagation()
      setNoteDropOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent): void => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setNoteDropOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setNoteDropOver(false)
    const type = e.dataTransfer.getData('dragtype')
    if (type === 'note') {
      const noteId = e.dataTransfer.getData('noteid')
      if (noteId) onDropNote?.(noteId)
    } else if (type === 'folder') {
      const folderId = e.dataTransfer.getData('folderid')
      if (folderId && folderId !== sectionId) onDropFolder?.(folderId)
    }
  }

  const isDropTarget = noteDropOver || folderDragOver

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 섹션 헤더 */}
      <div
        className="group flex items-center w-full border-b transition-colors"
        style={{
          borderColor: 'var(--app-border)',
          backgroundColor: isDropTarget ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)') : 'transparent',
          outline: isDropTarget ? `1px dashed ${isDark ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.4)'}` : 'none',
          outlineOffset: -1,
        }}
      >
        {renamingContent ?? (
          <button
            className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-xs text-left min-w-0"
            onClick={onToggle}
            style={{ color: 'var(--app-text-muted)' }}
            draggable={draggableFolder}
            onDragStart={draggableFolder ? onFolderDragStart : undefined}
          >
            <span
              className="text-[7px] flex-shrink-0 transition-transform duration-150"
              style={{ transform: expanded ? 'rotate(90deg)' : 'none', color: 'var(--app-text-dim)' }}
            >▶</span>
            <span className="flex-shrink-0">{icon}</span>
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

      {/* 메모 목록 */}
      {expanded && (
        <div>
          {notes.length === 0 ? (
            <div className="pl-6 py-2 text-[10px]" style={{ color: 'var(--app-text-dim)' }}>
              메모 없음
            </div>
          ) : (
            notes.map((note) => (
              <NoteCard key={note.id} note={note} isDark={isDark} indent />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── 사이드바 트리 전체 ─────────────────────────────────────────
function SidebarTree({
  searchQuery,
  sortBy,
  isDark,
}: {
  searchQuery: string
  sortBy: SortBy
  isDark: boolean
}): JSX.Element {
  const { notes, createNote, updateNote } = useNoteStore()
  const { folders, load, createFolder, renameFolder, deleteFolder, reorderFolders } = useFolderStore()
  const { selectedTagId, noteTagMap, loadNoteTagIds } = useTagStore()

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['uncategorized']))
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)
  const [folderDragOverId, setFolderDragOverId] = useState<string | null>(null)

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
    const handler = (): void => { setDraggingFolderId(null); setFolderDragOverId(null) }
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
        folderDragOver={folderDragOverId === 'uncategorized'}
      />

      {/* 사용자 폴더 */}
      {folders.map((folder) => {
        const isRenaming = renamingId === folder.id
        return (
          <TreeSection
            key={folder.id}
            sectionId={folder.id}
            icon="📁"
            label={folder.name}
            notes={folderNotes(folder.id)}
            expanded={expandedIds.has(folder.id)}
            isDark={isDark}
            onToggle={() => toggle(folder.id)}
            onNewNote={() => { createNote({ folderId: folder.id }); setExpandedIds((p) => new Set([...p, folder.id])) }}
            onRename={() => { setRenamingId(folder.id); setRenameValue(folder.name) }}
            onDelete={() => deleteFolder(folder.id)}
            onDropNote={(noteId) => { updateNote(noteId, { folderId: folder.id }) }}
            onDropFolder={(folderId) => { void reorderFolders(folderId, folder.id) }}
            draggableFolder
            onFolderDragStart={handleFolderDragStart(folder.id)}
            folderDragOver={folderDragOverId === folder.id && draggingFolderId !== folder.id}
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
          />
        )
      })}

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
            <SidebarTree searchQuery={searchQuery} sortBy={sortBy} isDark={isDark} />
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
