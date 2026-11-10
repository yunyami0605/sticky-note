import { useEffect, useState, useMemo, useRef } from 'react'
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
import type { SortBy } from '../../../../shared/types'

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

// ── 폴더 패널 ──────────────────────────────────────────────────
const TAG_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#6b7280']

function FolderPanel({ notes, isDark }: { notes: { folderId: string | null }[]; isDark: boolean }): JSX.Element {
  const { folders, selectedFolderId, selectFolder, createFolder, renameFolder, deleteFolder, load } = useFolderStore()
  const { tags, selectedTagId, selectTag, createTag, deleteTag, load: loadTags } = useTagStore()
  const [newFolderName, setNewFolderName] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [addingTag, setAddingTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[4])

  useEffect(() => { load(); loadTags() }, [load, loadTags])

  const folderCount = (folderId: string | null): number =>
    notes.filter((n) => n.folderId === folderId).length

  const allCount = notes.length

  const handleAddFolder = async (): Promise<void> => {
    const name = newFolderName.trim()
    if (!name) return
    await createFolder(name)
    setNewFolderName('')
    setAddingFolder(false)
  }

  const handleRename = async (id: string): Promise<void> => {
    const name = renameValue.trim()
    if (name) await renameFolder(id, name)
    setRenamingId(null)
  }

  const handleAddTag = async (): Promise<void> => {
    const name = newTagName.trim()
    if (!name) return
    await createTag(name, newTagColor)
    setNewTagName('')
    setAddingTag(false)
  }

  const folderRowStyle = (active: boolean): React.CSSProperties => ({
    backgroundColor: active ? 'var(--app-active)' : 'transparent',
    color: active ? 'var(--app-text)' : 'var(--app-text-muted)',
  })

  return (
    <div className="border-b flex-shrink-0" style={{ borderColor: 'var(--app-border)' }}>
      {/* 전체 */}
      <button
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs transition-colors"
        style={folderRowStyle(selectedFolderId === null && !useTagStore.getState().selectedTagId)}
        onClick={() => { selectFolder(null); selectTag(null) }}
      >
        <span className="flex items-center gap-1.5">
          <span>📋</span> 전체
        </span>
        <span className="text-[10px] opacity-50">{allCount}</span>
      </button>

      {/* 미분류 */}
      <button
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs transition-colors"
        style={folderRowStyle(selectedFolderId === 'uncategorized')}
        onClick={() => { selectFolder('uncategorized'); selectTag(null) }}
      >
        <span className="flex items-center gap-1.5">
          <span>📄</span> 미분류
        </span>
        <span className="text-[10px] opacity-50">{folderCount(null)}</span>
      </button>

      {/* 사용자 폴더 */}
      {folders.map((folder) => (
        <div key={folder.id} className="group flex items-center">
          {renamingId === folder.id ? (
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
          ) : (
            <button
              className="flex items-center justify-between flex-1 px-3 py-1.5 text-xs transition-colors"
              style={folderRowStyle(selectedFolderId === folder.id)}
              onClick={() => { selectFolder(folder.id); selectTag(null) }}
              onDoubleClick={() => { setRenamingId(folder.id); setRenameValue(folder.name) }}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                <span>📁</span>
                <span className="truncate">{folder.name}</span>
              </span>
              <span className="text-[10px] opacity-50">{folderCount(folder.id)}</span>
            </button>
          )}
          <button
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 mr-1.5 text-[10px] flex-shrink-0 transition-opacity"
            style={{ color: 'var(--app-text-muted)' }}
            onClick={() => deleteFolder(folder.id)}
            title="폴더 삭제"
          >
            ×
          </button>
        </div>
      ))}

      {/* 새 폴더 입력 */}
      {addingFolder ? (
        <div className="px-2 py-1">
          <input
            autoFocus
            className="w-full px-2 py-0.5 text-xs rounded outline-none"
            style={{ backgroundColor: 'var(--app-hover)', color: 'var(--app-text)' }}
            placeholder="폴더 이름..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => { handleAddFolder(); setAddingFolder(false) }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder()
              if (e.key === 'Escape') setAddingFolder(false)
            }}
          />
        </div>
      ) : (
        <button
          className="flex items-center gap-1 w-full px-3 py-1.5 text-[10px] transition-opacity hover:opacity-80"
          style={{ color: 'var(--app-text-dim)' }}
          onClick={() => setAddingFolder(true)}
        >
          + 폴더 추가
        </button>
      )}

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div className="px-3 py-1.5 border-t" style={{ borderColor: 'var(--app-border)' }}>
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => { selectTag(selectedTagId === tag.id ? null : tag.id); selectFolder(null) }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all"
                style={{
                  backgroundColor: selectedTagId === tag.id ? tag.color : `${tag.color}22`,
                  color: selectedTagId === tag.id
                    ? '#fff'
                    : (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'),
                  border: `1px solid ${tag.color}66`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 태그 추가 */}
      {addingTag ? (
        <div className="px-2 py-1.5 border-t flex flex-col gap-1" style={{ borderColor: 'var(--app-border)' }}>
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
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: c,
                  outline: newTagColor === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            <button
              className="flex-1 text-[10px] py-0.5 rounded"
              style={{ backgroundColor: 'var(--app-active)', color: 'var(--app-text)' }}
              onClick={handleAddTag}
            >
              추가
            </button>
            <button
              className="text-[10px] py-0.5 px-2 rounded"
              style={{ color: 'var(--app-text-muted)' }}
              onClick={() => setAddingTag(false)}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          className="flex items-center gap-1 w-full px-3 py-1 text-[10px] transition-opacity hover:opacity-80"
          style={{ color: 'var(--app-text-dim)', borderTop: `1px solid var(--app-border)` }}
          onClick={() => setAddingTag(true)}
        >
          + 태그 추가
        </button>
      )}
    </div>
  )
}

// ── 메인 패널 ─────────────────────────────────────────────────
export function MainPanel(): JSX.Element {
  const { notes, isLoading, loadNotes, createNote, _addNote, _removeNote, setWindowOpen } = useNoteStore()
  const { themeMode, themeColor, loaded, load: loadSettings, shortcuts } = useSettingsStore()
  const { selectedFolderId } = useFolderStore()
  const { selectedTagId, noteTagMap, loadNoteTagIds } = useTagStore()
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
        createNote({ folderId: selectedFolderId === 'uncategorized' ? null : (selectedFolderId ?? null) })
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
  }, [shortcuts, createNote, selectedFolderId])

  // 노트 태그 일괄 로드
  useEffect(() => {
    notes.forEach((n) => {
      if (!noteTagMap[n.id]) loadNoteTagIds(n.id)
    })
  }, [notes, noteTagMap, loadNoteTagIds])

  const displayedNotes = useMemo(() => {
    let filtered = [...notes]

    // 폴더 필터
    if (selectedFolderId === 'uncategorized') {
      filtered = filtered.filter((n) => !n.folderId)
    } else if (selectedFolderId) {
      filtered = filtered.filter((n) => n.folderId === selectedFolderId)
    }

    // 태그 필터
    if (selectedTagId) {
      filtered = filtered.filter((n) => (noteTagMap[n.id] ?? []).includes(selectedTagId))
    }

    // 검색
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      filtered = filtered.filter((n) => {
        if (!n.content) return false
        try {
          const parsed = JSON.parse(n.content)
          const texts: string[] = []
          const walk = (node: { text?: string; content?: unknown[] }): void => {
            if (node.text) texts.push(node.text)
            node.content?.forEach((c) => walk(c as typeof node))
          }
          parsed.content?.forEach((n: unknown) => walk(n as { text?: string; content?: unknown[] }))
          return texts.join(' ').toLowerCase().includes(q)
        } catch {
          return n.content.toLowerCase().includes(q)
        }
      })
    }

    // 정렬
    if (sortBy === 'updatedAt') {
      filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    } else if (sortBy === 'createdAt') {
      filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    } else if (sortBy === 'color') {
      const ORDER = ['yellow', 'blue', 'green', 'pink', 'purple', 'white']
      filtered.sort((a, b) => ORDER.indexOf(a.color) - ORDER.indexOf(b.color))
    }

    return filtered
  }, [notes, selectedFolderId, selectedTagId, noteTagMap, searchQuery, sortBy])

  if (!loaded) return <div className="flex h-screen" style={{ backgroundColor: 'var(--app-main)' }} />

  return (
    <div
      className="flex h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--app-main)' }}
      data-theme-mode={themeMode}
      data-theme-color={themeColor}
    >
      {/* ── 좌측 사이드바 ── */}
      {showSidebar && <div
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
              onClick={() => createNote({ folderId: selectedFolderId === 'uncategorized' ? null : (selectedFolderId ?? null) })}
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

        {/* 폴더 + 태그 패널 */}
        <FolderPanel notes={notes} isDark={isDark} />

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

        {/* 노트 목록 */}
        <div className="sidebar-list flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-xs" style={{ color: 'var(--app-text-dim)' }}>
              불러오는 중...
            </div>
          ) : displayedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2" style={{ color: 'var(--app-text-dim)' }}>
              {searchQuery ? (
                <p className="text-xs">검색 결과 없음</p>
              ) : (
                <>
                  <span className="text-3xl">📝</span>
                  <p className="text-xs">메모가 없습니다</p>
                </>
              )}
            </div>
          ) : (
            displayedNotes.map((note) => <NoteCard key={note.id} note={note} isDark={isDark} />)
          )}
        </div>
      </div>}

      {/* ── 우측 에디터 패널 ── */}
      <InlineEditor isDark={isDark} />

      {/* ── 설정 패널 오버레이 ── */}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
