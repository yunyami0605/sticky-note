import { useState, useRef, useEffect } from 'react'
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

// ── 글자 크기 ──────────────────────────────────────────────────
const FONT_SIZES = ['8', '10', '12', '14', '16', '18', '20', '24', '32']

function FontSizePicker({ editor, dark }: { editor: Editor; dark?: boolean }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = (editor.getAttributes('textStyle').fontSize as string | undefined)?.replace('px', '') ?? '14'

  const apply = (size: string): void => {
    const n = parseInt(size)
    if (isNaN(n) || n < 1) return
    editor.chain().focus().setFontSize(`${n}px`).run()
    setOpen(false)
    setCustomInput('')
  }

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') apply(customInput)
    if (e.key === 'Escape') setOpen(false)
  }

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCustomInput('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="글자 크기"
        className={`h-6 px-1.5 rounded text-xs font-medium transition-colors min-w-[32px]
          ${dark ? 'text-white/50 hover:bg-white/10 hover:text-white/80' : 'hover:bg-black/10'}`}
      >
        {current}
      </button>
      {open && (
        <div className={`absolute bottom-full left-0 mb-1 rounded-lg shadow-xl border z-50 overflow-hidden w-28
          ${dark ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-black/10'}`}
        >
          <div className={`flex items-center gap-1 px-2 py-1.5 border-b ${dark ? 'border-white/10' : 'border-black/10'}`}>
            <input
              ref={inputRef}
              type="number"
              min="1"
              max="200"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder={current}
              className={`w-full text-xs rounded px-1.5 py-0.5 outline-none
                ${dark ? 'bg-white/10 text-white placeholder-white/30' : 'bg-black/5 text-black placeholder-black/30'}`}
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); apply(customInput) }}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors whitespace-nowrap
                ${dark ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-black/10 hover:bg-black/20'}`}
            >
              적용
            </button>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); apply(s) }}
                className={`flex items-center justify-between w-full px-3 py-1 text-xs transition-colors
                  ${s === current
                    ? dark ? 'bg-white/15 text-white' : 'bg-black/10'
                    : dark ? 'text-white/70 hover:bg-white/10' : 'hover:bg-black/5'
                  }`}
              >
                <span>{s}px</span>
                {s === current && <span className={dark ? 'text-white/50' : 'text-black/40'}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 글자 폰트 ──────────────────────────────────────────────────
const FONTS: { label: string; value: string }[] = [
  { label: '기본',     value: '' },
  { label: '고딕',     value: "'Noto Sans KR', sans-serif" },
  { label: '명조',     value: "'Noto Serif KR', Georgia, serif" },
  { label: '등폭',     value: "'JetBrains Mono', 'Courier New', monospace" },
]

function FontFamilyPicker({ editor, dark }: { editor: Editor; dark?: boolean }): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = editor.getAttributes('textStyle').fontFamily ?? ''
  const currentLabel = FONTS.find((f) => f.value === current)?.label ?? '기본'

  const apply = (value: string): void => {
    if (value) editor.chain().focus().setFontFamily(value).run()
    else editor.chain().focus().unsetFontFamily().run()
    setOpen(false)
  }

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
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="글자 폰트"
        className={`h-6 px-1.5 rounded text-xs font-medium transition-colors min-w-[36px]
          ${dark ? 'text-white/50 hover:bg-white/10 hover:text-white/80' : 'hover:bg-black/10'}`}
      >
        {currentLabel}
      </button>
      {open && (
        <div className={`absolute bottom-full left-0 mb-1 rounded-lg shadow-xl border z-50 overflow-hidden
          ${dark ? 'bg-[#1a1a2e] border-white/10' : 'bg-white border-black/10'}`}
        >
          {FONTS.map((f) => (
            <button
              key={f.label}
              onMouseDown={(e) => { e.preventDefault(); apply(f.value) }}
              style={{ fontFamily: f.value || undefined }}
              className={`block w-full text-left px-3 py-1 text-xs transition-colors whitespace-nowrap
                ${f.value === current
                  ? dark ? 'bg-white/15 text-white' : 'bg-black/10'
                  : dark ? 'text-white/70 hover:bg-white/10' : 'hover:bg-black/5'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 색상 팔레트 (10열 × 7행) ───────────────────────────────────
const COLOR_PALETTE = [
  // 흑/회/백
  ['#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#efefef','#f3f3f3','#ffffff'],
  // 빨강
  ['#99000d','#cc0000','#e06666','#ea9999','#f4cccc','#ff0000','#ff4040','#ff8080','#ffb3b3','#ffd2d2'],
  // 주황
  ['#783f04','#b45f06','#e69138','#f9cb9c','#fce5cd','#ff6600','#ff8c00','#ffb347','#ffd580','#fff0cc'],
  // 노랑
  ['#7f6000','#bf9000','#f1c232','#ffe599','#fff2cc','#e6b800','#f9d900','#ffee55','#fff099','#fffacc'],
  // 초록
  ['#274e13','#38761d','#6aa84f','#93c47d','#d9ead3','#007700','#33aa33','#55cc55','#99dd99','#cceecc'],
  // 파랑
  ['#073763','#1155cc','#4a86e8','#9fc5e8','#cfe2f3','#0066cc','#0088ff','#44aaff','#88ccff','#cce8ff'],
  // 보라
  ['#20124d','#674ea7','#9b59b6','#c39bd3','#e8daef','#7700cc','#9933ff','#bb55ff','#ddaaff','#f0d9ff'],
]

// 체크마크를 어두운 색으로 표시해야 하는 밝은 색상들
const LIGHT_COLORS = new Set([
  '#ffffff','#f3f3f3','#efefef','#d9d9d9','#cccccc','#b7b7b7',
  '#f4cccc','#ffd2d2','#ffb3b3','#ff8080',
  '#fce5cd','#fff0cc','#ffd580','#ffb347',
  '#fff2cc','#fffacc','#fff099','#ffee55','#ffe599',
  '#d9ead3','#cceecc','#99dd99',
  '#cfe2f3','#cce8ff','#88ccff',
  '#e8daef','#f0d9ff','#ddaaff',
])

interface ColorPopupProps {
  currentColor: string
  onSelect: (color: string) => void
  dark?: boolean
  resetLabel?: string
}

function ColorPopup({ currentColor, onSelect, dark, resetLabel = '재설정' }: ColorPopupProps): JSX.Element {
  return (
    <div
      className={`absolute bottom-full right-0 mb-2 p-3 rounded-2xl shadow-2xl border z-50
        ${dark ? 'bg-[#1e1e30] border-white/15' : 'bg-white border-black/10'}`}
    >
      {/* 재설정 */}
      <button
        onMouseDown={(e) => { e.preventDefault(); onSelect('') }}
        className={`flex items-center gap-2 w-full px-2 py-1.5 mb-2 rounded-lg text-xs font-medium transition-colors
          ${dark
            ? 'text-white/55 hover:bg-white/10 hover:text-white/90'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        {resetLabel}
      </button>

      {/* 색상 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 22px)', gap: '4px' }}>
        {COLOR_PALETTE.flat().map((color) => (
          <button
            key={color}
            onMouseDown={(e) => { e.preventDefault(); onSelect(color) }}
            title={color}
            style={{ backgroundColor: color, width: 22, height: 22 }}
            className={`rounded-full relative flex items-center justify-center
              transition-transform hover:scale-125 hover:z-10
              ${(color === '#ffffff' || color === '#f3f3f3' || color === '#efefef')
                ? 'ring-1 ring-inset ring-black/15'
                : ''
              }`}
          >
            {currentColor.toLowerCase() === color.toLowerCase() && (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M2 5.5L4.5 8L9 3"
                  stroke={LIGHT_COLORS.has(color) ? '#444' : '#fff'}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── 글자색 ────────────────────────────────────────────────────
function TextColorPicker({ editor, dark }: { editor: Editor; dark?: boolean }): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentColor = (editor.getAttributes('textStyle').color as string | undefined) ?? ''

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const apply = (color: string): void => {
    if (!color) editor.chain().focus().unsetColor().run()
    else editor.chain().focus().setColor(color).run()
    setOpen(false)
  }

  const barColor = currentColor || (dark ? 'rgba(255,255,255,0.4)' : '#374151')

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="글자색"
        className={`w-7 h-8 flex flex-col items-center justify-center rounded transition-colors
          ${dark
            ? open ? 'bg-white/20' : 'hover:bg-white/10'
            : open ? 'bg-black/15' : 'hover:bg-black/10'
          }`}
      >
        <span
          className={`font-black leading-none select-none ${dark ? 'text-white/85' : 'text-gray-800'}`}
          style={{ fontSize: 15, fontFamily: 'Georgia, serif', lineHeight: 1 }}
        >
          A
        </span>
        <span
          className="rounded-sm"
          style={{ width: 14, height: 3, backgroundColor: barColor, marginTop: 1 }}
        />
      </button>
      {open && (
        <ColorPopup currentColor={currentColor} onSelect={apply} dark={dark} resetLabel="기본색" />
      )}
    </div>
  )
}

// ── 글자 배경색 (Highlight) ──────────────────────────────────
function HighlightPicker({ editor, dark }: { editor: Editor; dark?: boolean }): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentColor = (editor.getAttributes('highlight').color as string | undefined) ?? ''

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const apply = (color: string): void => {
    if (!color) editor.chain().focus().unsetHighlight().run()
    else editor.chain().focus().setHighlight({ color }).run()
    setOpen(false)
  }

  const swatchColor = currentColor || (dark ? 'rgba(255,255,255,0.4)' : '#374151')

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="글자 배경색"
        className={`w-8 h-8 flex flex-col items-center justify-center rounded transition-colors
          ${dark
            ? open ? 'bg-white/20' : 'hover:bg-white/10'
            : open ? 'bg-black/15' : 'hover:bg-black/10'
          }`}
      >
        {/* 하이라이터 마커 아이콘: 사각 박스 안 A */}
        <div
          className="relative flex items-center justify-center rounded-sm"
          style={{
            width: 20,
            height: 20,
            backgroundColor: currentColor || (dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'),
            border: `1px solid ${dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}`,
          }}
        >
          <span
            className={`font-black leading-none select-none ${dark ? 'text-white/85' : 'text-gray-800'}`}
            style={{ fontSize: 13, fontFamily: 'Georgia, serif', lineHeight: 1 }}
          >
            A
          </span>
        </div>
        <span
          className="rounded-sm"
          style={{ width: 16, height: 3, backgroundColor: swatchColor, marginTop: 1 }}
        />
      </button>
      {open && (
        <ColorPopup currentColor={currentColor} onSelect={apply} dark={dark} resetLabel="배경색 없음" />
      )}
    </div>
  )
}

// ── 메인 툴바 ──────────────────────────────────────────────────
export function Toolbar({ editor, dark }: Props): JSX.Element | null {
  if (!editor) return null

  const divider = <div className={`w-px h-4 mx-0.5 ${dark ? 'bg-white/10' : 'bg-black/15'}`} />

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

      {divider}

      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용문">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="2" width="2" height="9" rx="1" fill="currentColor" opacity="0.8"/>
          <rect x="5" y="2" width="2" height="9" rx="1" fill="currentColor" opacity="0.5"/>
          <rect x="8" y="4" width="4" height="1.5" rx="0.75" fill="currentColor" opacity="0.6"/>
          <rect x="8" y="7" width="3" height="1.5" rx="0.75" fill="currentColor" opacity="0.6"/>
        </svg>
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="구분선">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <rect x="1" y="6" width="11" height="1.5" rx="0.75" fill="currentColor" opacity="0.7"/>
        </svg>
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드 블록">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M4 3L1 6.5L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 3L12 6.5L9 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().setDetails().run()} active={editor.isActive('details')} title="토글 블록">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M3 4.5L6.5 8L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="1" y="9.5" width="11" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
        </svg>
      </ToolButton>
      <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleCallout().run()} active={editor.isActive('callout')} title="콜아웃">
        💡
      </ToolButton>

      {divider}

      <FontSizePicker editor={editor} dark={dark} />
      <FontFamilyPicker editor={editor} dark={dark} />
      <TextColorPicker editor={editor} dark={dark} />
      <HighlightPicker editor={editor} dark={dark} />
    </div>
  )
}
