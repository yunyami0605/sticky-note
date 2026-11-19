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
      className="w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium transition-all"
      style={{
        backgroundColor: active
          ? (dark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.14)')
          : 'transparent',
        color: active
          ? (dark ? '#a5b4fc' : '#6366f1')
          : (dark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.42)'),
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = dark
            ? 'rgba(255,255,255,0.08)'
            : 'rgba(0,0,0,0.06)'
          ;(e.currentTarget as HTMLButtonElement).style.color = dark
            ? 'rgba(255,255,255,0.8)'
            : 'rgba(0,0,0,0.72)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          ;(e.currentTarget as HTMLButtonElement).style.color = dark
            ? 'rgba(255,255,255,0.48)'
            : 'rgba(0,0,0,0.42)'
        }
      }}
    >
      {children}
    </button>
  )
}

// ── 버튼 그룹 컨테이너 ───────────────────────────────────────
function ToolGroup({ children, dark }: { children: React.ReactNode; dark?: boolean }): JSX.Element {
  return (
    <div
      className="flex items-center rounded-md px-0.5"
      style={{ backgroundColor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
    >
      {children}
    </div>
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
        className="h-6 px-1.5 rounded-md text-xs font-medium transition-colors min-w-[32px]"
        style={{
          color: dark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.42)',
          backgroundColor: open ? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
        }}
      >
        {current}
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-1.5 rounded-xl shadow-2xl border z-50 overflow-hidden w-28"
          style={{
            backgroundColor: dark ? '#1e1e2e' : '#ffffff',
            borderColor: dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
          }}
        >
          <div
            className="flex items-center gap-1 px-2 py-1.5 border-b"
            style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}
          >
            <input
              ref={inputRef}
              type="number"
              min="1"
              max="200"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder={current}
              className="w-full text-xs rounded-md px-1.5 py-0.5 outline-none"
              style={{
                backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                color: dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
              }}
            />
            <button
              onMouseDown={(e) => { e.preventDefault(); apply(customInput) }}
              className="text-xs px-1.5 py-0.5 rounded-md transition-colors whitespace-nowrap"
              style={{
                backgroundColor: dark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.12)',
                color: dark ? '#a5b4fc' : '#6366f1',
              }}
            >
              적용
            </button>
          </div>
          <div className="max-h-44 overflow-y-auto py-0.5">
            {FONT_SIZES.map((s) => (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); apply(s) }}
                className="flex items-center justify-between w-full px-3 py-1 text-xs transition-colors"
                style={{
                  backgroundColor: s === current
                    ? (dark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                    : 'transparent',
                  color: s === current
                    ? (dark ? '#a5b4fc' : '#6366f1')
                    : (dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)'),
                }}
              >
                <span>{s}px</span>
                {s === current && (
                  <span style={{ color: dark ? 'rgba(165,180,252,0.6)' : '#6366f1', fontSize: 10 }}>✓</span>
                )}
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
        className="h-6 px-1.5 rounded-md text-xs font-medium transition-colors min-w-[36px]"
        style={{
          color: dark ? 'rgba(255,255,255,0.48)' : 'rgba(0,0,0,0.42)',
          backgroundColor: open ? (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)') : 'transparent',
        }}
      >
        {currentLabel}
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-1.5 rounded-xl shadow-2xl border z-50 overflow-hidden py-0.5"
          style={{
            backgroundColor: dark ? '#1e1e2e' : '#ffffff',
            borderColor: dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
          }}
        >
          {FONTS.map((f) => (
            <button
              key={f.label}
              onMouseDown={(e) => { e.preventDefault(); apply(f.value) }}
              style={{ fontFamily: f.value || undefined }}
              className="block w-full text-left px-3 py-1.5 text-xs transition-colors whitespace-nowrap"
              onMouseEnter={(e) => {
                if (f.value !== current) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = dark
                    ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (f.value !== current) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{
                fontFamily: f.value || undefined,
                color: f.value === current
                  ? (dark ? '#a5b4fc' : '#6366f1')
                  : (dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)'),
              }}>
                {f.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 색상 팔레트 (10열 × 7행) ───────────────────────────────────
const COLOR_PALETTE = [
  ['#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#efefef','#f3f3f3','#ffffff'],
  ['#99000d','#cc0000','#e06666','#ea9999','#f4cccc','#ff0000','#ff4040','#ff8080','#ffb3b3','#ffd2d2'],
  ['#783f04','#b45f06','#e69138','#f9cb9c','#fce5cd','#ff6600','#ff8c00','#ffb347','#ffd580','#fff0cc'],
  ['#7f6000','#bf9000','#f1c232','#ffe599','#fff2cc','#e6b800','#f9d900','#ffee55','#fff099','#fffacc'],
  ['#274e13','#38761d','#6aa84f','#93c47d','#d9ead3','#007700','#33aa33','#55cc55','#99dd99','#cceecc'],
  ['#073763','#1155cc','#4a86e8','#9fc5e8','#cfe2f3','#0066cc','#0088ff','#44aaff','#88ccff','#cce8ff'],
  ['#20124d','#674ea7','#9b59b6','#c39bd3','#e8daef','#7700cc','#9933ff','#bb55ff','#ddaaff','#f0d9ff'],
]

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
      className="absolute bottom-full right-0 mb-2 p-3 rounded-2xl shadow-2xl border z-50"
      style={{
        backgroundColor: dark ? '#1e1e2e' : '#ffffff',
        borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)',
      }}
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); onSelect('') }}
        className="flex items-center gap-2 w-full px-2 py-1.5 mb-2 rounded-lg text-xs font-medium transition-colors"
        style={{ color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = dark
            ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
        {resetLabel}
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 22px)', gap: '4px' }}>
        {COLOR_PALETTE.flat().map((color) => (
          <button
            key={color}
            onMouseDown={(e) => { e.preventDefault(); onSelect(color) }}
            title={color}
            style={{ backgroundColor: color, width: 22, height: 22 }}
            className={`rounded-full relative flex items-center justify-center transition-transform hover:scale-125 hover:z-10
              ${(color === '#ffffff' || color === '#f3f3f3' || color === '#efefef')
                ? 'ring-1 ring-inset ring-black/15' : ''
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

  const barColor = currentColor || (dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)')

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="글자색"
        className="w-7 h-7 flex flex-col items-center justify-center rounded-md transition-colors"
        style={{
          backgroundColor: open
            ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)')
            : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = dark
              ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }
        }}
      >
        <span
          className="font-black leading-none select-none"
          style={{
            fontSize: 14,
            fontFamily: 'Georgia, serif',
            lineHeight: 1,
            color: dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
          }}
        >A</span>
        <span
          className="rounded-sm"
          style={{ width: 13, height: 2.5, backgroundColor: barColor, marginTop: 2 }}
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

  const swatchColor = currentColor || (dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)')

  return (
    <div ref={ref} className="relative">
      <button
        onMouseDown={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        title="글자 배경색"
        className="w-7 h-7 flex flex-col items-center justify-center rounded-md transition-colors"
        style={{
          backgroundColor: open
            ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)')
            : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = dark
              ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }
        }}
      >
        <div
          className="relative flex items-center justify-center rounded-sm"
          style={{
            width: 18,
            height: 18,
            backgroundColor: currentColor || (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'),
            border: `1px solid ${dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.2)'}`,
          }}
        >
          <span
            className="font-black leading-none select-none"
            style={{
              fontSize: 12,
              fontFamily: 'Georgia, serif',
              lineHeight: 1,
              color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)',
            }}
          >A</span>
        </div>
        <span
          className="rounded-sm"
          style={{ width: 13, height: 2.5, backgroundColor: swatchColor, marginTop: 2 }}
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCollapsed(entry.contentRect.width < 420)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!popupOpen) return
    const handler = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopupOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [popupOpen])

  if (!editor) return null

  const renderButtons = (): JSX.Element => (
    <>
      {/* 서식 그룹 */}
      <ToolGroup dark={dark}>
        <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게 (⌘B)">
          <strong style={{ fontWeight: 700 }}>B</strong>
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
      </ToolGroup>

      {/* 헤딩 그룹 */}
      <ToolGroup dark={dark}>
        <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목 1">
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '-0.02em' }}>H1</span>
        </ToolButton>
        <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목 2">
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '-0.02em' }}>H2</span>
        </ToolButton>
      </ToolGroup>

      {/* 목록 그룹 */}
      <ToolGroup dark={dark}>
        <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="불릿 목록">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="2" cy="4" r="1.2" fill="currentColor"/>
            <circle cx="2" cy="7" r="1.2" fill="currentColor"/>
            <circle cx="2" cy="10" r="1.2" fill="currentColor"/>
            <rect x="4.5" y="3.3" width="6.5" height="1.4" rx="0.7" fill="currentColor" opacity="0.7"/>
            <rect x="4.5" y="6.3" width="6.5" height="1.4" rx="0.7" fill="currentColor" opacity="0.7"/>
            <rect x="4.5" y="9.3" width="4.5" height="1.4" rx="0.7" fill="currentColor" opacity="0.7"/>
          </svg>
        </ToolButton>
        <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <text x="0.5" y="5.5" style={{ fontSize: '5px', fontWeight: 700 }} fill="currentColor">1.</text>
            <text x="0.5" y="8.5" style={{ fontSize: '5px', fontWeight: 700 }} fill="currentColor">2.</text>
            <text x="0.5" y="11.5" style={{ fontSize: '5px', fontWeight: 700 }} fill="currentColor">3.</text>
            <rect x="5" y="3.3" width="6" height="1.3" rx="0.65" fill="currentColor" opacity="0.7"/>
            <rect x="5" y="6.3" width="6" height="1.3" rx="0.65" fill="currentColor" opacity="0.7"/>
            <rect x="5" y="9.3" width="4" height="1.3" rx="0.65" fill="currentColor" opacity="0.7"/>
          </svg>
        </ToolButton>
        <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="체크리스트">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="0.8" y="2.8" width="3.4" height="3.4" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1.6 4.6l0.9 0.9 1.5-1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="0.8" y="7.8" width="3.4" height="3.4" rx="0.8" stroke="currentColor" strokeWidth="1.2" opacity="0.5"/>
            <rect x="5.5" y="4" width="6" height="1.3" rx="0.65" fill="currentColor" opacity="0.7"/>
            <rect x="5.5" y="9" width="4.5" height="1.3" rx="0.65" fill="currentColor" opacity="0.5"/>
          </svg>
        </ToolButton>
      </ToolGroup>

      {/* 블록 그룹 */}
      <ToolGroup dark={dark}>
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
        <ToolButton dark={dark} onClick={() => {
          if (editor.isActive('details')) {
            editor.chain().focus().unsetDetails().run()
          } else {
            editor.chain().focus().insertContent({
              type: 'details',
              attrs: { open: true },
              content: [
                { type: 'detailsSummary', content: [{ type: 'paragraph' }] },
                { type: 'detailsContent', content: [{ type: 'paragraph' }] },
              ],
            }).run()
          }
        }} active={editor.isActive('details')} title="토글 블록">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M3 4.5L6.5 8L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="1" y="9.5" width="11" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
          </svg>
        </ToolButton>
        <ToolButton dark={dark} onClick={() => editor.chain().focus().toggleCallout().run()} active={editor.isActive('callout')} title="콜아웃">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect x="1" y="2.5" width="11" height="8" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.8"/>
            <path d="M6.5 5.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="6.5" cy="4" r="0.8" fill="currentColor"/>
          </svg>
        </ToolButton>
      </ToolGroup>

      {/* 텍스트 스타일 그룹 */}
      <div className="flex items-center gap-0.5 ml-auto">
        <FontSizePicker editor={editor} dark={dark} />
        <FontFamilyPicker editor={editor} dark={dark} />
        <TextColorPicker editor={editor} dark={dark} />
        <HighlightPicker editor={editor} dark={dark} />
      </div>
    </>
  )

  if (!collapsed) {
    return (
      <div
        ref={containerRef}
        className="flex items-center gap-1 px-2.5 py-2 flex-wrap"
        style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}` }}
      >
        {renderButtons()}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-end px-2 py-1.5"
      style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}` }}
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); setPopupOpen((v) => !v) }}
        title="서식 도구"
        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
        style={{
          backgroundColor: popupOpen
            ? (dark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.14)')
            : (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
          color: popupOpen
            ? (dark ? '#a5b4fc' : '#6366f1')
            : (dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'),
        }}
      >
        {/* 편집 아이콘 */}
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M9 1.5L11.5 4L5 10.5H2.5V8L9 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          <path d="M1.5 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
        </svg>
      </button>

      {popupOpen && (
        <div
          className="absolute bottom-full right-0 mb-1 rounded-xl shadow-2xl border z-50 p-2 flex flex-wrap gap-1"
          style={{
            backgroundColor: dark ? '#1e1e2e' : '#ffffff',
            borderColor: dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)',
            minWidth: 260,
          }}
        >
          {renderButtons()}
        </div>
      )}
    </div>
  )
}
