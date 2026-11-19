import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/core'
import { useState, useRef, useEffect } from 'react'

interface Props {
  editor: Editor
  dark?: boolean
}

function ColorDot({ color, active, onSelect }: { color: string; active: boolean; onSelect: (c: string) => void }): JSX.Element {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect(color) }}
      className="w-3.5 h-3.5 rounded-full flex-shrink-0 transition-transform hover:scale-125"
      style={{
        backgroundColor: color,
        outline: active ? '2px solid rgba(99,102,241,0.8)' : 'none',
        outlineOffset: 1,
        border: color === '#ffffff' ? '1px solid rgba(0,0,0,0.2)' : 'none',
      }}
    />
  )
}

const QUICK_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#ffffff']

export function SelectionToolbar({ editor, dark = false }: Props): JSX.Element {
  const [showColors, setShowColors] = useState(false)
  const [showHighlights, setShowHighlights] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShowColors(false)
    setShowHighlights(false)
  }, [editor.state.selection])

  const btn = (
    label: React.ReactNode,
    onClick: () => void,
    active: boolean,
    title: string
  ): JSX.Element => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium transition-all flex-shrink-0"
      style={{
        backgroundColor: active
          ? (dark ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.18)')
          : 'transparent',
        color: active
          ? (dark ? '#a5b4fc' : '#6366f1')
          : (dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)'),
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor =
          dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
      }}
    >
      {label}
    </button>
  )

  const divider = (
    <div className="w-px h-3.5 flex-shrink-0" style={{ backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }} />
  )

  const currentTextColor = (editor.getAttributes('textStyle').color as string | undefined) ?? ''
  const currentHighlight = (editor.getAttributes('highlight').color as string | undefined) ?? ''

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'top' }}
    >
      <div
        ref={ref}
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl shadow-2xl border"
        style={{
          backgroundColor: dark ? '#1e1e2e' : '#ffffff',
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {btn(<strong style={{ fontWeight: 700 }}>B</strong>, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), '굵게')}
        {btn(<em>I</em>, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), '기울임')}
        {btn(<span className="underline">U</span>, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), '밑줄')}
        {btn(<span className="line-through">S</span>, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), '취소선')}

        {divider}

        {/* 글자색 */}
        <div className="relative flex items-center">
          <button
            onMouseDown={(e) => { e.preventDefault(); setShowColors((v) => !v); setShowHighlights(false) }}
            title="글자색"
            className="flex flex-col items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ backgroundColor: showColors ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent' }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Georgia, serif', lineHeight: 1, color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)' }}>A</span>
            <span style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: currentTextColor || (dark ? 'rgba(255,255,255,0.4)' : '#374151'), marginTop: 1 }} />
          </button>
          {showColors && (
            <div
              className="absolute bottom-full left-0 mb-1.5 p-2 rounded-xl shadow-2xl border flex gap-1"
              style={{ backgroundColor: dark ? '#1e1e2e' : '#ffffff', borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColors(false) }}
                className="w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                style={{ borderColor: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
                title="기본색"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke={dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              {QUICK_COLORS.map((c) => (
                <ColorDot key={c} color={c} active={currentTextColor === c}
                  onSelect={(color) => { editor.chain().focus().setColor(color).run(); setShowColors(false) }} />
              ))}
            </div>
          )}
        </div>

        {/* 하이라이트 */}
        <div className="relative flex items-center">
          <button
            onMouseDown={(e) => { e.preventDefault(); setShowHighlights((v) => !v); setShowColors(false) }}
            title="하이라이트"
            className="flex flex-col items-center justify-center w-6 h-6 rounded transition-colors"
            style={{ backgroundColor: showHighlights ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent' }}
          >
            <div
              className="flex items-center justify-center rounded-sm"
              style={{
                width: 16, height: 16,
                backgroundColor: currentHighlight || (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'),
                border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'}`,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Georgia, serif', color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)' }}>A</span>
            </div>
          </button>
          {showHighlights && (
            <div
              className="absolute bottom-full left-0 mb-1.5 p-2 rounded-xl shadow-2xl border flex gap-1"
              style={{ backgroundColor: dark ? '#1e1e2e' : '#ffffff', borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
              <button
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHighlights(false) }}
                className="w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                style={{ borderColor: dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}
                title="없음"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 1l6 6M7 1L1 7" stroke={dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
              {QUICK_COLORS.map((c) => (
                <ColorDot key={c} color={c} active={currentHighlight === c}
                  onSelect={(color) => { editor.chain().focus().setHighlight({ color }).run(); setShowHighlights(false) }} />
              ))}
            </div>
          )}
        </div>

        {divider}

        {btn(
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 1.5h9M1 9.5h9M2.5 5.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>,
          () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          editor.isActive('heading', { level: 1 }),
          '제목 1'
        )}
        {btn(
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1 2h9M1 9h9M2.5 5.5h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>,
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          editor.isActive('heading', { level: 2 }),
          '제목 2'
        )}
      </div>
    </BubbleMenu>
  )
}
