import { useEffect, useRef, useCallback, useState } from 'react'
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
import { DragHandle } from '../../extensions/DragHandle'
import type { Note, UpdateNotePayload, NoteColor } from '../../../../shared/types'
import { useSettingsStore } from '../../store/settingsStore'
import { useCustomEmojiStore } from '../../store/customEmojiStore'
import { Toolbar } from '../Toolbar'
import { ColorPicker } from '../ColorPicker'
import EmojiPicker from '../EmojiPicker'
import { SelectionToolbar } from '../SelectionToolbar'

const lowlight = createLowlight(common)

interface Props {
  note: Note
  onNoteChange: (updated: Note) => void
}

function CustomEmojiIcon({ id }: { id: string }): JSX.Element {
  const { emojis } = useCustomEmojiStore()
  const ce = emojis.find(e => e.id === id)
  if (!ce) return <span>🏷️</span>
  return <img src={`file://${ce.path}`} alt={ce.name} className="w-4 h-4 object-contain inline" />
}

export function NoteEditor({ note, onNoteChange }: Props): JSX.Element {
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const { spellCheck, editorFontSize, editorTextColor, load: loadSettings, applyBroadcast } = useSettingsStore()
  const [zoomInput, setZoomInput] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    loadSettings()
    // 메인 창에서 설정이 변경되면 플로팅 창도 즉시 반영
    const off = window.api.settings.onUpdated((s) => applyBroadcast(s))
    return off
  }, [])

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
      Details.configure({ persist: true }),
      DetailsContent,
      DetailsSummary,
      Callout,
      SlashCommand,
      MentionNode,
      Mention.configure({
        onNavigate: (id) => { window.api.note.openWindow(id) },
      }),
      DragHandle,
    ],
    content: note.content ? JSON.parse(note.content) : '',
    onUpdate: ({ editor }) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        persistUpdate({ content: JSON.stringify(editor.getJSON()) })
      }, 150)
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

  // 창 내 zoom 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const isMod = e.metaKey || e.ctrlKey
      if (!isMod) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        const newZoom = Math.min(200, note.fontSize + 10)
        persistUpdate({ fontSize: newZoom })
        onNoteChange({ ...note, fontSize: newZoom })
      } else if (e.key === '-') {
        e.preventDefault()
        const newZoom = Math.max(50, note.fontSize - 10)
        persistUpdate({ fontSize: newZoom })
        onNoteChange({ ...note, fontSize: newZoom })
      } else if (e.key === '0') {
        e.preventDefault()
        persistUpdate({ fontSize: 100 })
        onNoteChange({ ...note, fontSize: 100 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [note, persistUpdate, onNoteChange])

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

  const handleZoomChange = (delta: number): void => {
    const newZoom = Math.min(200, Math.max(50, note.fontSize + delta))
    persistUpdate({ fontSize: newZoom })
    onNoteChange({ ...note, fontSize: newZoom })
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
            ref={emojiButtonRef}
            title="이모지 아이콘"
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => setShowEmojiPicker(p => !p)}
          >
            {note.icon?.startsWith('custom:')
              ? <CustomEmojiIcon id={note.icon.slice(7)} />
              : (note.icon ?? '🏷️')}
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              anchorRef={emojiButtonRef}
              onSelect={(icon) => {
                onNoteChange({ ...note, icon })
                window.api.note.update(note.id, { icon })
              }}
              onClear={() => {
                onNoteChange({ ...note, icon: null })
                window.api.note.update(note.id, { icon: null })
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
          <ColorPicker value={note.color} onChange={handleColorChange} />
        </div>
      </div>

      {/* editor area */}
      <div
        className="flex-1 overflow-y-auto pl-8 pr-3 py-2"
        style={{ fontSize: Math.round(editorFontSize * note.fontSize / 100), color: editorTextColor || undefined }}
      >
        {editor && <SelectionToolbar editor={editor} dark={false} />}
        <EditorContent editor={editor} className="tiptap h-full" spellCheck={spellCheck} />
      </div>

      {/* toolbar */}
      <Toolbar editor={editor} />

      {/* footer: zoom + opacity */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-black/10">
        <div className="flex items-center gap-0.5 flex-shrink-0" style={{ opacity: 0.5 }}>
          <button
            onClick={() => handleZoomChange(-10)}
            className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 text-xs font-bold"
            title="글자 배율 축소 (Cmd+-)"
          >−</button>
          {zoomInput !== null ? (
            <input
              type="number"
              className="text-[10px] font-medium tabular-nums text-center outline-none rounded"
              style={{ width: 36, backgroundColor: 'rgba(0,0,0,0.08)' }}
              value={zoomInput}
              autoFocus
              onChange={(e) => setZoomInput(e.target.value)}
              onBlur={() => {
                const v = parseInt(zoomInput)
                const clamped = isNaN(v) ? note.fontSize : Math.min(200, Math.max(50, v))
                persistUpdate({ fontSize: clamped })
                onNoteChange({ ...note, fontSize: clamped })
                setZoomInput(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setZoomInput(null)
              }}
            />
          ) : (
            <span
              className="text-[10px] font-medium tabular-nums min-w-[32px] text-center cursor-text"
              title="클릭하여 직접 입력 (Cmd+0으로 초기화)"
              onClick={() => setZoomInput(String(note.fontSize))}
            >{note.fontSize}%</span>
          )}
          <button
            onClick={() => handleZoomChange(10)}
            className="w-5 h-5 flex items-center justify-center rounded hover:opacity-70 text-xs font-bold"
            title="글자 배율 확대 (Cmd+=)"
          >+</button>
        </div>
        <div className="flex items-center gap-1.5 flex-1" style={{ opacity: 0.4 }} title="투명도">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.5"/>
          </svg>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={note.opacity}
            onChange={handleOpacityChange}
            className="flex-1 h-0.5 accent-current"
          />
        </div>
      </div>
    </div>
  )
}
