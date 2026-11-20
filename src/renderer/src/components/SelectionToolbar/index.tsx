import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Editor } from '@tiptap/core'

interface Props {
  editor: Editor
  dark?: boolean
}

const QUICK_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6', '#ffffff']

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

export function SelectionToolbar({ editor, dark = false }: Props): JSX.Element | null {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [showColors, setShowColors] = useState(false)
  const [showHighlights, setShowHighlights] = useState(false)

  const updatePos = useCallback(() => {
    const { from, to } = editor.state.selection
    if (from === to) { setPos(null); return }

    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { setPos(null); return }

    // 선택 영역이 에디터 안에 있는지 확인
    const anchor = sel.anchorNode
    if (!anchor || !editor.view.dom.contains(anchor)) { setPos(null); return }

    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.width === 0) { setPos(null); return }

    setPos({ x: rect.left + rect.width / 2, y: rect.top })
  }, [editor])

  useEffect(() => {
    const onMouseUp = (): void => { setTimeout(updatePos, 20) }
    const onKeyUp = (): void => { setTimeout(updatePos, 20) }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keyup', onKeyUp)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [updatePos])

  useEffect(() => {
    const onSelectionUpdate = (): void => {
      const { from, to } = editor.state.selection
      if (from === to) { setPos(null); setShowColors(false); setShowHighlights(false) }
    }
    editor.on('selectionUpdate', onSelectionUpdate)
    return () => { editor.off('selectionUpdate', onSelectionUpdate) }
  }, [editor])

  // 색상 패널 외부 클릭 닫기
  useEffect(() => {
    if (!showColors && !showHighlights) return
    const handler = (): void => { setShowColors(false); setShowHighlights(false) }
    setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => document.removeEventListener('mousedown', handler)
  }, [showColors, showHighlights])

  if (!pos) return null

  const bg = dark ? '#1e1e2e' : '#ffffff'
  const border = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  const btn = (label: React.ReactNode, onClick: () => void, active: boolean, title: string): JSX.Element => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className="w-6 h-6 flex items-center justify-center rounded-md text-xs font-medium transition-all flex-shrink-0"
      style={{
        backgroundColor: active ? (dark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.14)') : 'transparent',
        color: active ? (dark ? '#a5b4fc' : '#6366f1') : (dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)'),
      }}
    >
      {label}
    </button>
  )

  const divider = <div className="w-px h-3.5 flex-shrink-0" style={{ backgroundColor: border }} />

  const currentTextColor = (editor.getAttributes('textStyle').color as string | undefined) ?? ''
  const currentHighlight = (editor.getAttributes('highlight').color as string | undefined) ?? ''

  const colorSubpanel = (
    <div
      className="flex gap-1 p-1.5 rounded-lg shadow-xl border"
      style={{ backgroundColor: bg, borderColor: border }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColors(false) }}
        className="w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0"
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
  )

  const highlightSubpanel = (
    <div
      className="flex gap-1 p-1.5 rounded-lg shadow-xl border"
      style={{ backgroundColor: bg, borderColor: border }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHighlights(false) }}
        className="w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0"
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
  )

  const toolbar = (
    <div
      style={{ position: 'fixed', left: pos.x, top: pos.y - 48, transform: 'translateX(-50%)', zIndex: 9999, WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
    >
      {/* 서브패널 */}
      {showColors && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 4 }}>
          {colorSubpanel}
        </div>
      )}
      {showHighlights && (
        <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 4 }}>
          {highlightSubpanel}
        </div>
      )}

      {/* 메인 툴바 */}
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl shadow-2xl border"
        style={{ backgroundColor: bg, borderColor: border, backdropFilter: 'blur(12px)' }}
      >
        {btn(<strong style={{ fontWeight: 700 }}>B</strong>, () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), '굵게')}
        {btn(<em>I</em>, () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), '기울임')}
        {btn(<span className="underline">U</span>, () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), '밑줄')}
        {btn(<span className="line-through">S</span>, () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), '취소선')}
        {divider}
        {/* 글자색 */}
        <button
          onMouseDown={(e) => { e.preventDefault(); setShowColors((v) => !v); setShowHighlights(false) }}
          className="w-6 h-6 flex flex-col items-center justify-center rounded-md transition-colors flex-shrink-0"
          style={{ backgroundColor: showColors ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent' }}
          title="글자색"
        >
          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Georgia, serif', lineHeight: 1, color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)' }}>A</span>
          <span style={{ width: 12, height: 2, borderRadius: 1, backgroundColor: currentTextColor || (dark ? 'rgba(255,255,255,0.4)' : '#374151'), marginTop: 1 }} />
        </button>
        {/* 하이라이트 */}
        <button
          onMouseDown={(e) => { e.preventDefault(); setShowHighlights((v) => !v); setShowColors(false) }}
          className="w-6 h-6 flex flex-col items-center justify-center rounded-md transition-colors flex-shrink-0"
          style={{ backgroundColor: showHighlights ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)') : 'transparent' }}
          title="하이라이트"
        >
          <div className="flex items-center justify-center rounded-sm"
            style={{ width: 16, height: 16, backgroundColor: currentHighlight || (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)'), border: `1px solid ${dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.18)'}` }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Georgia, serif', color: dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)' }}>A</span>
          </div>
        </button>
        {divider}
        {btn(<span style={{ fontSize: 10, fontWeight: 700 }}>H1</span>, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }), '제목 1')}
        {btn(<span style={{ fontSize: 10, fontWeight: 700 }}>H2</span>, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), '제목 2')}
      </div>
    </div>
  )

  return createPortal(toolbar, document.body)
}
