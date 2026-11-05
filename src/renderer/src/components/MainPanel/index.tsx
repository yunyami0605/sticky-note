import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import { useNoteStore } from '../../store/noteStore'
import { NoteCard } from '../NoteCard'
import { Toolbar } from '../Toolbar'

function InlineEditor(): JSX.Element | null {
  const { notes, selectedId, updateNote } = useNoteStore()
  const note = notes.find((n) => n.id === selectedId) ?? null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: '메모를 입력하세요...' }),
    ],
    content: note?.content ? JSON.parse(note.content) : '',
    onUpdate: ({ editor }) => {
      if (!selectedId) return
      updateNote(selectedId, { content: JSON.stringify(editor.getJSON()) })
    },
  })

  // 선택된 노트가 바뀌면 에디터 내용 교체
  useEffect(() => {
    if (!editor || !note) return
    const incoming = note.content ? JSON.parse(note.content) : ''
    editor.commands.setContent(incoming, false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  if (!note) return null

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* 우측 상단 헤더 */}
      <div
        className="flex items-center justify-end px-4 py-2.5 border-b border-white/5"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* 에디터 */}
      <div className="dark-editor flex-1 overflow-y-auto px-6 py-4 text-white/85 text-sm">
        <EditorContent editor={editor} className="tiptap h-full" />
      </div>

      {/* 툴바 */}
      <div className="border-t border-white/5">
        <Toolbar editor={editor} dark />
      </div>
    </div>
  )
}

export function MainPanel(): JSX.Element {
  const { notes, isLoading, loadNotes, createNote, _addNote, _removeNote } = useNoteStore()

  useEffect(() => {
    loadNotes()
    const offCreated = window.api.note.onCreated(_addNote)
    const offDeleted = window.api.note.onDeleted(_removeNote)
    return () => { offCreated(); offDeleted() }
  }, [loadNotes, _addNote, _removeNote])

  return (
    <div className="flex h-screen bg-[#16213e] text-white overflow-hidden">
      {/* ── 좌측 사이드바 ── */}
      <div className="flex flex-col w-[200px] flex-shrink-0 bg-[#1a1a2e] border-r border-white/5">

        {/* 사이드바 헤더 (드래그 영역) */}
        <div
          className="flex items-center justify-between px-3 py-2.5 border-b border-white/5"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* 정렬 아이콘 */}
          <button
            className="text-white/40 hover:text-white/70 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="정렬"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 4h11M4 7.5h7M6 11h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* 새 메모 아이콘 */}
          <button
            onClick={() => createNote()}
            className="text-white/40 hover:text-white/70 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            title="새 메모"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M11.5 1.5L13.5 3.5L5.5 11.5H3.5V9.5L11.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M2 13.5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 노트 목록 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-20 text-xs text-white/30">
              불러오는 중...
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-white/25">
              <span className="text-3xl">📝</span>
              <p className="text-xs">메모가 없습니다</p>
            </div>
          ) : (
            notes.map((note) => <NoteCard key={note.id} note={note} />)
          )}
        </div>
      </div>

      {/* ── 우측 에디터 패널 ── */}
      <InlineEditor />
    </div>
  )
}
