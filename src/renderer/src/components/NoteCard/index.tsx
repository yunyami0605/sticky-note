import { type Note } from '../../../../shared/types'
import { useNoteStore } from '../../store/noteStore'

const COLOR_LABELS: Record<Note['color'], string> = {
  yellow: 'bg-yellow-200',
  blue: 'bg-blue-200',
  green: 'bg-green-200',
  pink: 'bg-pink-200',
  purple: 'bg-purple-200',
  white: 'bg-gray-100',
}

interface Props {
  note: Note
}

function getPreviewText(content: string): string {
  if (!content) return '빈 메모'
  try {
    const parsed = JSON.parse(content)
    const texts: string[] = []
    const walk = (node: { type?: string; text?: string; content?: unknown[] }): void => {
      if (node.text) texts.push(node.text)
      node.content?.forEach((child) => walk(child as typeof node))
    }
    parsed.content?.forEach((n: unknown) => walk(n as { type?: string; text?: string; content?: unknown[] }))
    return texts.join(' ').trim() || '빈 메모'
  } catch {
    return content.slice(0, 80)
  }
}

export function NoteCard({ note }: Props): JSX.Element {
  const { deleteNote, openNoteWindow } = useNoteStore()

  const handleOpen = (): void => {
    openNoteWindow(note.id)
  }

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation()
    deleteNote(note.id)
  }

  const preview = getPreviewText(note.content)
  const updatedAt = new Date(note.updatedAt).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`relative rounded-xl p-3 cursor-pointer group transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] note-${note.color}`}
      onClick={handleOpen}
    >
      {/* header bar */}
      <div className={`${COLOR_LABELS[note.color]} rounded-lg h-2 mb-2 -mx-1`} />

      <p className="text-sm leading-relaxed line-clamp-4 note-text opacity-80">
        {preview}
      </p>

      <p className="text-[10px] mt-2 opacity-40 note-text">{updatedAt}</p>

      {/* delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-full bg-black/10 hover:bg-red-400 hover:text-white text-xs"
        title="삭제"
      >
        ×
      </button>
    </div>
  )
}
