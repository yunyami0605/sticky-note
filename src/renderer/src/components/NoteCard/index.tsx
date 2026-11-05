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
    return `오전 ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  if (diffDays === 1) return '어제'
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' })
}

export function NoteCard({ note }: Props): JSX.Element {
  const { selectedId, setSelectedId, deleteNote } = useNoteStore()
  const isSelected = selectedId === note.id

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation()
    deleteNote(note.id)
  }

  return (
    <div
      onClick={() => setSelectedId(note.id)}
      className={`group relative flex items-center gap-0 cursor-pointer border-b border-white/5 transition-colors ${
        isSelected ? 'bg-[#b5a07a]/30' : 'hover:bg-white/5'
      }`}
    >
      {/* color accent bar */}
      <div className={`w-[3px] self-stretch flex-shrink-0 ${COLOR_ACCENT[note.color]}`} />

      {/* content */}
      <div className="flex flex-col px-3 py-2.5 flex-1 min-w-0">
        <span className="text-sm text-white/90 truncate leading-snug">
          {getTitle(note.content)}
        </span>
        <span className="text-[11px] text-white/35 mt-0.5">
          {formatDate(note.updatedAt)}
        </span>
      </div>

      {/* delete button */}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 mr-2 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/70 text-white/60 hover:text-white text-[10px] transition-all flex-shrink-0"
        title="삭제"
      >
        ×
      </button>
    </div>
  )
}
