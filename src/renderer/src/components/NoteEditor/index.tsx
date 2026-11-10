import { useEffect, useRef, useCallback } from 'react'
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
import { Callout } from '../../extensions/Callout'
import { SlashCommand } from '../../extensions/SlashCommand'
import { Mention, MentionNode } from '../../extensions/Mention'
import type { Note, UpdateNotePayload, NoteColor, FontSize as NoteFontSize } from '../../../../shared/types'
import { useSettingsStore } from '../../store/settingsStore'
import { Toolbar } from '../Toolbar'
import { ColorPicker } from '../ColorPicker'

const lowlight = createLowlight(common)

const FONT_SIZE_CLASS: Record<NoteFontSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

interface Props {
  note: Note
  onNoteChange: (updated: Note) => void
}

export function NoteEditor({ note, onNoteChange }: Props): JSX.Element {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { spellCheck, load: loadSettings } = useSettingsStore()

  useEffect(() => { loadSettings() }, [])

  const persistUpdate = useCallback((payload: UpdateNotePayload): void => {
    // DB 저장 + 로컬 state 즉시 반영
    window.api.note.update(note.id, payload).then((updated) => {
      if (updated) onNoteChange(updated)
    })
  }, [note.id, onNoteChange])

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
    content: note.content ? JSON.parse(note.content) : '',
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        persistUpdate({ content: JSON.stringify(editor.getJSON()) })
      }, 500)
    },
  })

  useEffect(() => {
    if (!editor || !note.content) return
    try {
      const incoming = JSON.parse(note.content)
      if (JSON.stringify(incoming) !== JSON.stringify(editor.getJSON())) {
        editor.commands.setContent(incoming, false)
      }
    } catch { /* ignore */ }
  }, [note.content, editor])

  const handleColorChange = (color: NoteColor): void => {
    // 즉시 로컬 state 반영 후 DB 저장
    onNoteChange({ ...note, color })
    window.api.note.update(note.id, { color })
  }

  const handlePinToggle = (): void => {
    const isPinned = !note.isPinned
    onNoteChange({ ...note, isPinned })
    window.api.window.setPin(note.id, isPinned)
  }

  const handleMinimize = (): void => {
    window.api.window.minimize(note.id)
  }

  const handleClose = (): void => {
    window.api.note.closeWindow(note.id)
  }

  const cycleFontSize = (): void => {
    const sizes: NoteFontSize[] = ['sm', 'md', 'lg']
    const fontSize = sizes[(sizes.indexOf(note.fontSize) + 1) % sizes.length]
    onNoteChange({ ...note, fontSize })
    window.api.note.update(note.id, { fontSize })
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const opacity = parseFloat(e.target.value)
    onNoteChange({ ...note, opacity })
    window.api.note.update(note.id, { opacity })
  }

  return (
    <div
      className={`flex flex-col h-screen note-${note.color} note-bg note-text rounded-xl overflow-hidden select-none`}
      style={{ opacity: note.opacity }}
    >
      {/* drag handle / header */}
      <div
        className="note-header flex items-center justify-between px-2 py-1.5 cursor-move"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div
          className="flex items-center gap-1.5 group"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleClose}
            className="w-4 h-4 rounded-full bg-red-400 hover:bg-red-500 transition-colors flex items-center justify-center"
            title="닫기"
          >
            <span className="hidden group-hover:block text-[9px] font-bold text-red-800 leading-none">×</span>
          </button>
          <button
            onClick={handleMinimize}
            className="w-4 h-4 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors flex items-center justify-center"
            title="최소화"
          >
            <span className="hidden group-hover:block text-[9px] font-bold text-yellow-800 leading-none">−</span>
          </button>
          <button
            onClick={handlePinToggle}
            className={`w-4 h-4 rounded-full transition-colors flex items-center justify-center ${
              note.isPinned ? 'bg-green-500 hover:bg-green-600' : 'bg-green-300 hover:bg-green-400'
            }`}
            title={note.isPinned ? '고정 해제' : '항상 위에 고정'}
          >
            <span className="hidden group-hover:block text-[9px] font-bold text-green-800 leading-none">
              {note.isPinned ? '↓' : '↑'}
            </span>
          </button>
        </div>

        <div
          className="flex items-center gap-1.5"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {/* 이모지 아이콘 */}
          <button
            title="이모지 아이콘"
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => {
              const emoji = prompt('이모지 입력 (비우면 제거)', note.icon ?? '')
              if (emoji !== null) {
                onNoteChange({ ...note, icon: emoji || null })
                window.api.note.update(note.id, { icon: emoji || null })
              }
            }}
          >
            {note.icon ?? '🏷️'}
          </button>
          <ColorPicker value={note.color} onChange={handleColorChange} />
        </div>
      </div>

      {/* editor area */}
      <div className={`flex-1 overflow-y-auto px-3 py-2 ${FONT_SIZE_CLASS[note.fontSize]}`}>
        <EditorContent editor={editor} className="tiptap h-full" spellCheck={spellCheck} />
      </div>

      {/* toolbar */}
      <Toolbar editor={editor} />

      {/* footer: font size + opacity */}
      <div className="flex items-center gap-2 px-2 py-1 border-t border-black/10">
        <button
          onClick={cycleFontSize}
          className="text-[10px] opacity-50 hover:opacity-80 transition-opacity"
          title="글자 크기 변경"
        >
          A{note.fontSize === 'lg' ? '↓' : '↑'}
        </button>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.05"
          value={note.opacity}
          onChange={handleOpacityChange}
          className="flex-1 h-1 accent-current opacity-40 hover:opacity-70"
          title="투명도"
        />
      </div>
    </div>
  )
}
