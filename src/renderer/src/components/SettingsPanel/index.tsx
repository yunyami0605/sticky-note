import { useState, useRef, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useNoteStore } from '../../store/noteStore'
import type { ThemeMode, ThemeColor, StartBehavior } from '../../../../shared/types'

interface Props {
  onClose: () => void
}

// ── 테마 색상 팝업 셀렉터 ─────────────────────────────────────
function ThemeColorPicker({
  colors,
  current,
  isDark,
  onChange,
}: {
  colors: { value: ThemeColor; label: string; bg: string }[]
  current: ThemeColor
  isDark: boolean
  onChange: (c: ThemeColor) => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const currentColor = colors.find((c) => c.value === current)

  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <section>
      <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--app-text-muted)' }}>
        테마 색상
      </p>
      <div ref={ref} className="relative">
        {/* 현재 색상 표시 버튼 */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--app-hover)',
            border: '1px solid var(--app-border)',
          }}
        >
          <span
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{
              backgroundColor: currentColor?.bg,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
            }}
          />
          <span className="flex-1 text-xs text-left font-medium" style={{ color: 'var(--app-text)' }}>
            {currentColor?.label}
          </span>
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            className="transition-transform"
            style={{ color: 'var(--app-text-muted)', transform: open ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* 팝업 색상 그리드 */}
        {open && (
          <div
            className="absolute top-full left-0 mt-1.5 p-3 rounded-xl shadow-2xl border z-50 w-full"
            style={{
              backgroundColor: isDark ? '#1e1e30' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex flex-col gap-1">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { onChange(c.value); setOpen(false) }}
                  className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg transition-colors text-left"
                  style={{
                    backgroundColor: current === c.value
                      ? isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
                      : 'transparent',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: c.bg,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                    }}
                  />
                  <span className="flex-1 text-xs font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)' }}>
                    {c.label}
                  </span>
                  {current === c.value && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5L4.5 8L9 3" stroke={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const DARK_COLORS: { value: ThemeColor; label: string; bg: string }[] = [
  { value: 'navy',     label: '네이비',    bg: '#16213e' },
  { value: 'midnight', label: '미드나잇',  bg: '#0d0d1a' },
  { value: 'ocean',    label: '오션',      bg: '#0a1929' },
  { value: 'forest',   label: '포레스트',  bg: '#0d1f0f' },
  { value: 'rose',     label: '로즈',      bg: '#1a0c0e' },
  { value: 'slate',    label: '슬레이트',  bg: '#18181b' },
]

const LIGHT_COLORS: { value: ThemeColor; label: string; bg: string }[] = [
  { value: 'navy',     label: '블루',      bg: '#f0f4f8' },
  { value: 'midnight', label: '그레이',    bg: '#f5f5f5' },
  { value: 'ocean',    label: '시안',      bg: '#f0f7f9' },
  { value: 'forest',   label: '그린',      bg: '#f2f7f2' },
  { value: 'rose',     label: '로즈',      bg: '#faf4f4' },
  { value: 'slate',    label: '슬레이트',  bg: '#f8f8f8' },
]

export function SettingsPanel({ onClose }: Props): JSX.Element {
  const { themeMode, themeColor, startBehavior, spellCheck, update } = useSettingsStore()
  const { notes, selectedId } = useNoteStore()
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const isDark = themeMode === 'dark'

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const handleModeChange = (mode: ThemeMode): void => {
    update({ themeMode: mode })
  }

  const handleColorChange = (color: ThemeColor): void => {
    update({ themeColor: color })
  }

  const handleStartBehaviorChange = (behavior: StartBehavior): void => {
    update({ startBehavior: behavior })
  }

  const handleExportCurrent = async (): Promise<void> => {
    if (!selectedId) return
    setExportStatus('내보내는 중...')
    const result = await window.api.note.exportTxt(selectedId)
    setExportStatus(result.success ? '저장 완료!' : '취소됨')
    setTimeout(() => setExportStatus(null), 2000)
  }

  const handleExportAll = async (): Promise<void> => {
    setExportStatus('내보내는 중...')
    const result = await window.api.note.exportAll()
    setExportStatus(result.success ? `${result.count}개 저장 완료!` : '취소됨')
    setTimeout(() => setExportStatus(null), 2000)
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="h-full w-72 overflow-y-auto flex flex-col"
        style={{
          backgroundColor: 'var(--app-sidebar)',
          borderLeft: '1px solid var(--app-border)',
        }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--app-border)', WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--app-text)' }}>설정</span>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onClose() }}
            className="w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:opacity-70"
            style={{
              WebkitAppRegion: 'no-drag',
              color: 'var(--app-text-muted)',
              backgroundColor: 'var(--app-hover)',
            } as React.CSSProperties}
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-6 px-4 py-5">

          {/* 테마 모드 */}
          <section>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--app-text-muted)' }}>
              테마 모드
            </p>
            <div className="flex gap-2">
              {(['dark', 'light'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: themeMode === mode ? 'var(--app-active)' : 'var(--app-hover)',
                    color: themeMode === mode ? 'var(--app-text)' : 'var(--app-text-muted)',
                    border: `1px solid ${themeMode === mode ? 'var(--app-text-muted)' : 'transparent'}`,
                  }}
                >
                  {mode === 'dark' ? '다크' : '라이트'}
                </button>
              ))}
            </div>
          </section>

          {/* 테마 색상 */}
          <ThemeColorPicker
            colors={colors}
            current={themeColor}
            isDark={isDark}
            onChange={handleColorChange}
          />

          {/* 시작 동작 */}
          <section>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--app-text-muted)' }}>
              시작 동작
            </p>
            <div className="flex flex-col gap-1.5">
              {([
                { value: 'main', label: '메인 창 열기', desc: '앱 시작 시 목록 창 표시' },
                { value: 'tray', label: '트레이만',     desc: '백그라운드로 시작' },
              ] as { value: StartBehavior; label: string; desc: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleStartBehaviorChange(opt.value)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors"
                  style={{
                    backgroundColor: startBehavior === opt.value ? 'var(--app-active)' : 'transparent',
                    border: `1px solid ${startBehavior === opt.value ? 'var(--app-border)' : 'transparent'}`,
                  }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                    style={{
                      borderColor: startBehavior === opt.value ? 'var(--app-text)' : 'var(--app-text-dim)',
                    }}
                  >
                    {startBehavior === opt.value && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--app-text)' }} />
                    )}
                  </span>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--app-text)' }}>{opt.label}</p>
                    <p className="text-[11px]" style={{ color: 'var(--app-text-dim)' }}>{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* 맞춤법 검사 */}
          <section>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--app-text-muted)' }}>
              편집기
            </p>
            <button
              onClick={() => update({ spellCheck: !spellCheck })}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'var(--app-hover)',
                border: '1px solid var(--app-border)',
              }}
            >
              <div>
                <p className="text-xs font-medium text-left" style={{ color: 'var(--app-text)' }}>맞춤법 검사</p>
                <p className="text-[11px] text-left" style={{ color: 'var(--app-text-dim)' }}>빨간 밑줄 표시 (macOS 시스템)</p>
              </div>
              {/* 토글 스위치 */}
              <div
                className="relative w-10 h-[22px] rounded-full flex-shrink-0 transition-colors overflow-hidden"
                style={{ backgroundColor: spellCheck ? '#4ade80' : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)') }}
              >
                <span
                  className="absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: spellCheck ? 'translateX(21px)' : 'translateX(3px)' }}
                />
              </div>
            </button>
          </section>

          {/* 내보내기 */}
          <section>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--app-text-muted)' }}>
              내보내기
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleExportCurrent}
                disabled={!selectedId}
                className="w-full py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--app-hover)',
                  color: 'var(--app-text)',
                  border: '1px solid var(--app-border)',
                }}
              >
                현재 메모 내보내기 (.txt)
              </button>
              <button
                onClick={handleExportAll}
                disabled={notes.length === 0}
                className="w-full py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-30"
                style={{
                  backgroundColor: 'var(--app-hover)',
                  color: 'var(--app-text)',
                  border: '1px solid var(--app-border)',
                }}
              >
                전체 메모 내보내기 ({notes.length}개)
              </button>
              {exportStatus && (
                <p className="text-[11px] text-center" style={{ color: 'var(--app-text-muted)' }}>
                  {exportStatus}
                </p>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
