import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { Editor, Range } from '@tiptap/core'

interface CommandItem {
  title: string
  description: string
  icon: string
  command: (props: { editor: Editor; range: Range }) => void
}

export const SLASH_COMMANDS: CommandItem[] = [
  {
    title: '제목 1',
    description: 'H1 큰 제목',
    icon: 'H1',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: '제목 2',
    description: 'H2 중간 제목',
    icon: 'H2',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: '제목 3',
    description: 'H3 작은 제목',
    icon: 'H3',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: '불릿 목록',
    description: '• 항목 목록',
    icon: '•≡',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: '번호 목록',
    description: '1. 순서 목록',
    icon: '1≡',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: '체크리스트',
    description: '☑ 할 일 목록',
    icon: '☑',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: '토글',
    description: '▶ 접기/펼치기 블록',
    icon: '▶',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setDetails().run(),
  },
  {
    title: '콜아웃',
    description: '💡 강조 블록',
    icon: '💡',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCallout().run(),
  },
  {
    title: '코드 블록',
    description: '</> 코드 입력',
    icon: '</>',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: '인용문',
    description: '❝ 인용 블록',
    icon: '❝',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: '구분선',
    description: '— 수평 구분선',
    icon: '—',
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
]

export interface SlashCommandMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface Props {
  items: CommandItem[]
  command: (item: CommandItem) => void
  dark?: boolean
}

export const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, Props>(
  ({ items, command, dark }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(ref, () => ({
      onKeyDown(event: KeyboardEvent) {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((i) => (i - 1 + items.length) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          if (items[selectedIndex]) command(items[selectedIndex])
          return true
        }
        return false
      },
    }))

    if (!items.length) return null

    return (
      <div
        className="rounded-xl shadow-2xl border overflow-hidden"
        style={{
          minWidth: 200,
          maxHeight: 280,
          overflowY: 'auto',
          backgroundColor: dark ? '#1e1e30' : '#ffffff',
          borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
        }}
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            onMouseDown={(e) => { e.preventDefault(); command(item) }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors"
            style={{
              backgroundColor: index === selectedIndex
                ? dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                : 'transparent',
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span
              className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              }}
            >
              {item.icon}
            </span>
            <div>
              <p className="text-xs font-medium" style={{ color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
                {item.title}
              </p>
              <p className="text-[10px]" style={{ color: dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

SlashCommandMenu.displayName = 'SlashCommandMenu'
