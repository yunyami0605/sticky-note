import type { Editor } from '@tiptap/core'

interface Props {
  editor: Editor | null
  dark?: boolean
}

interface ToolButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  dark?: boolean
  children: React.ReactNode
}

function ToolButton({ onClick, active, title, dark, children }: ToolButtonProps): JSX.Element {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium transition-colors
        ${dark
          ? active ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white/80'
          : active ? 'bg-black/20 text-current' : 'hover:bg-black/10'
        }`}
    >
      {children}
    </button>
  )
}

export function Toolbar({ editor, dark }: Props): JSX.Element | null {
  if (!editor) return null

  const divider = (
    <div className={`w-px h-4 mx-0.5 ${dark ? 'bg-white/10' : 'bg-black/15'}`} />
  )

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게 (⌘B)">
        <strong>B</strong>
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임 (⌘I)">
        <em>I</em>
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄 (⌘U)">
        <span className="underline">U</span>
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선">
        <span className="line-through">S</span>
      </ToolButton>

      {divider}

      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목 1">
        H1
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목 2">
        H2
      </ToolButton>

      {divider}

      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="불릿 목록">
        •≡
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">
        1≡
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="체크리스트">
        ☑
      </ToolButton>
    </div>
  )
}
