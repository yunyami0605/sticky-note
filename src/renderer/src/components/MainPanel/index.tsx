import { useEffect } from 'react'
import { useNoteStore } from '../../store/noteStore'
import { NoteCard } from '../NoteCard'

export function MainPanel(): JSX.Element {
  const { notes, isLoading, loadNotes, createNote, _addNote, _removeNote } = useNoteStore()

  useEffect(() => {
    loadNotes()
    const offCreated = window.api.note.onCreated(_addNote)
    const offDeleted = window.api.note.onDeleted(_removeNote)
    return () => { offCreated(); offDeleted() }
  }, [loadNotes, _addNote, _removeNote])

  return (
    <div className="flex flex-col h-screen bg-[#1a1a2e] text-white">
      {/* titlebar */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-[#16213e] border-b border-white/5"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <h1 className="text-sm font-semibold tracking-wide opacity-80">Sticky Note</h1>
        <button
          onClick={() => createNote()}
          className="text-xs px-3 py-1 rounded-full bg-yellow-400 text-gray-900 font-medium hover:bg-yellow-300 transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="새 메모 (⌘N)"
        >
          + 새 메모
        </button>
      </div>

      {/* note grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full opacity-30 text-sm">
            불러오는 중...
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
            <span className="text-5xl">📝</span>
            <p className="text-sm">메모가 없습니다</p>
            <p className="text-xs">+ 새 메모 버튼을 눌러 시작하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-2 text-[10px] opacity-20 border-t border-white/5">
        {notes.length}개의 메모
      </div>
    </div>
  )
}
