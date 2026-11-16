import { useEffect, useRef, useState } from 'react'
import type { KeyShortcut, ShortcutSettings } from '../../../../shared/types'
import { useSettingsStore, isMac } from '../../store/settingsStore'

const KEY_DISPLAY: Record<string, string> = {
  backspace: '⌫',
  enter: '↵',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  escape: 'ESC',
  tab: 'Tab',
  ' ': 'Space',
}

export function formatShortcut(sc: KeyShortcut): string {
  if (!sc.key) return '—'
  const parts: string[] = []
  if (sc.meta)  parts.push(isMac ? '⌘' : 'Win')
  if (sc.ctrl)  parts.push('Ctrl')
  if (sc.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (sc.alt)   parts.push(isMac ? '⌥' : 'Alt')
  const display = KEY_DISPLAY[sc.key.toLowerCase()] ?? sc.key.toUpperCase()
  parts.push(display)
  return parts.join(isMac ? '' : '+')
}

const SHORTCUT_LABELS: Record<keyof ShortcutSettings, string> = {
  newNote:       '새 메모',
  searchFocus:   '검색 포커스',
  openSettings:  '설정 열기',
  toggleSidebar: '사이드바 토글',
  deleteNote:    '메모 삭제',
  duplicateNote: '메모 복제',
  openWindow:    '팝업으로 열기',
  prevNote:      '이전 메모',
  nextNote:      '다음 메모',
  toggleTheme:   '테마 전환',
}

const SHORTCUT_GROUPS: { label: string; keys: (keyof ShortcutSettings)[] }[] = [
  {
    label: '앱',
    keys: ['newNote', 'searchFocus', 'openSettings', 'toggleSidebar', 'toggleTheme'],
  },
  {
    label: '메모',
    keys: ['deleteNote', 'duplicateNote', 'openWindow', 'prevNote', 'nextNote'],
  },
]

function findConflict(
  sc: KeyShortcut,
  excludeName: keyof ShortcutSettings,
  shortcuts: ShortcutSettings,
): keyof ShortcutSettings | null {
  if (!sc.key) return null
  for (const [name, existing] of Object.entries(shortcuts) as [keyof ShortcutSettings, KeyShortcut][]) {
    if (name === excludeName || !existing.key) continue
    if (
      existing.key === sc.key &&
      existing.meta === sc.meta &&
      existing.ctrl === sc.ctrl &&
      existing.shift === sc.shift &&
      existing.alt === sc.alt
    ) {
      return name
    }
  }
  return null
}

// ── 키 입력 서브팝업 ─────────────────────────────────────────
interface CapturePopupProps {
  name: keyof ShortcutSettings
  isDark: boolean
  shortcuts: ShortcutSettings
  onSave: (sc: KeyShortcut, conflictName: keyof ShortcutSettings | null) => void
  onCancel: () => void
}

function CapturePopup({ name, isDark, shortcuts, onSave, onCancel }: CapturePopupProps): JSX.Element {
  const [pending, setPending] = useState<KeyShortcut | null>(null)
  const conflict = pending ? findConflict(pending, name, shortcuts) : null
  const current = shortcuts[name]

  const modalBg  = isDark ? '#252538' : '#ffffff'
  const inputBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
  const divider  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') { onCancel(); return }
      if (['Meta', 'Control', 'Shift', 'Alt'].includes(e.key)) return
      setPending({
        key: e.key.toLowerCase(),
        meta: e.metaKey,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
      })
    }
    document.addEventListener('keydown', handler, { capture: true })
    return () => document.removeEventListener('keydown', handler, { capture: true })
  }, [onCancel])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1100]" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div
        className="rounded-xl shadow-2xl w-[300px] flex flex-col overflow-hidden"
        style={{ backgroundColor: modalBg, border: `1px solid ${divider}` }}
      >
        {/* 헤더 */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--app-text-dim)' }}>
            단축키 변경
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--app-text)' }}>
            {SHORTCUT_LABELS[name]}
          </p>
        </div>

        {/* 키 입력 영역 */}
        <div className="px-5 pb-4">
          {/* 이전 단축키 */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px]" style={{ color: 'var(--app-text-dim)' }}>현재</span>
            <span
              className="text-[11px] font-mono px-2 py-0.5 rounded"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                color: current.key ? 'var(--app-text-muted)' : 'var(--app-text-dim)',
              }}
            >
              {formatShortcut(current)}
            </span>
          </div>

          <div
            className="flex items-center justify-center h-14 rounded-lg font-mono text-base"
            style={{
              backgroundColor: inputBg,
              border: `1.5px solid ${pending ? '#6366f1' : divider}`,
              color: pending ? '#818cf8' : 'var(--app-text-dim)',
            }}
          >
            {pending ? formatShortcut(pending) : '키를 입력하세요...'}
          </div>

          {/* 충돌 경고 */}
          {conflict && pending && (
            <div
              className="mt-2.5 px-3 py-2 rounded-lg text-[11px] leading-relaxed"
              style={{
                backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: isDark ? '#fca5a5' : '#dc2626',
              }}
            >
              <span className="font-mono font-semibold">{formatShortcut(pending)}</span>은 이미{' '}
              <span className="font-semibold">'{SHORTCUT_LABELS[conflict]}'</span>에 사용 중입니다.{' '}
              저장하면 해당 단축키가 비워집니다.
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div
          className="flex gap-2 px-5 py-3"
          style={{ borderTop: `1px solid ${divider}` }}
        >
          <button
            onClick={onCancel}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              color: 'var(--app-text)',
            }}
          >
            취소
          </button>
          <button
            onClick={() => { if (pending) onSave(pending, conflict) }}
            disabled={!pending}
            className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
            style={{
              backgroundColor: '#6366f1',
              color: '#ffffff',
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 단축키 목록 모달 ─────────────────────────────────────────
interface Props {
  isDark: boolean
  onClose: () => void
}

export function ShortcutsModal({ isDark, onClose }: Props): JSX.Element {
  const { shortcuts, update } = useSettingsStore()
  const [capturing, setCapturing] = useState<keyof ShortcutSettings | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleSave = (name: keyof ShortcutSettings, sc: KeyShortcut, conflictName: keyof ShortcutSettings | null): void => {
    const updated = { ...shortcuts, [name]: sc }
    if (conflictName) {
      updated[conflictName] = { key: '', meta: false, ctrl: false, shift: false, alt: false }
    }
    update({ shortcuts: updated })
    setCapturing(null)
  }

  const handleReset = (): void => {
    update({
      shortcuts: {
        newNote:       { key: 'n',         meta: isMac, ctrl: !isMac, shift: false, alt: false },
        searchFocus:   { key: 'f',         meta: isMac, ctrl: !isMac, shift: false, alt: false },
        openSettings:  { key: ',',         meta: isMac, ctrl: !isMac, shift: false, alt: false },
        toggleSidebar: { key: '\\',        meta: isMac, ctrl: !isMac, shift: false, alt: false },
        deleteNote:    { key: 'backspace',  meta: isMac, ctrl: !isMac, shift: false, alt: false },
        duplicateNote: { key: 'd',         meta: isMac, ctrl: !isMac, shift: false, alt: false },
        openWindow:    { key: 'enter',     meta: isMac, ctrl: !isMac, shift: false, alt: false },
        prevNote:      { key: 'arrowup',   meta: isMac, ctrl: !isMac, shift: false, alt: false },
        nextNote:      { key: 'arrowdown', meta: isMac, ctrl: !isMac, shift: false, alt: false },
        toggleTheme:   { key: 'l',         meta: isMac, ctrl: !isMac, shift: true,  alt: false },
      },
    })
  }

  const overlayBg = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)'
  const modalBg   = isDark ? '#1e1e2e' : '#ffffff'
  const headerBg  = isDark ? '#252535' : '#f5f5f5'
  const rowHover  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
  const divider   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 flex items-center justify-center z-[1000]"
        style={{ backgroundColor: overlayBg }}
        onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      >
        <div
          className="rounded-xl shadow-2xl w-[380px] max-h-[90vh] flex flex-col overflow-hidden"
          style={{ backgroundColor: modalBg }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ backgroundColor: headerBg, borderBottom: `1px solid ${divider}` }}
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>
              단축키 설정
            </span>
            <button
              onClick={onClose}
              className="text-lg leading-none opacity-50 hover:opacity-90 transition-opacity"
              style={{ color: 'var(--app-text)' }}
            >
              ×
            </button>
          </div>

          {/* 목록 */}
          <div className="overflow-y-auto flex-1 py-2">
            {SHORTCUT_GROUPS.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? 'mt-1' : ''}>
                <p
                  className="px-5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--app-text-dim)' }}
                >
                  {group.label}
                </p>
                {group.keys.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-5 py-2 mx-2 rounded-lg"
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = rowHover }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--app-text)' }}>
                      {SHORTCUT_LABELS[name]}
                    </span>
                    <button
                      onClick={() => setCapturing(name)}
                      className="text-xs px-2.5 py-1 rounded-md font-mono transition-colors min-w-[72px] text-center"
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
                        color: shortcuts[name].key ? 'var(--app-text)' : 'var(--app-text-dim)',
                        border: `1px solid ${divider}`,
                      }}
                    >
                      {formatShortcut(shortcuts[name])}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 푸터 */}
          <div
            className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ borderTop: `1px solid ${divider}` }}
          >
            <button
              onClick={handleReset}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--app-text)' }}
            >
              기본값 복원
            </button>
            <button
              onClick={onClose}
              className="text-xs px-4 py-1.5 rounded-lg transition-colors"
              style={{
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                color: 'var(--app-text)',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {capturing && (
        <CapturePopup
          name={capturing}
          isDark={isDark}
          shortcuts={shortcuts}
          onSave={(sc, conflictName) => handleSave(capturing, sc, conflictName)}
          onCancel={() => setCapturing(null)}
        />
      )}
    </>
  )
}
