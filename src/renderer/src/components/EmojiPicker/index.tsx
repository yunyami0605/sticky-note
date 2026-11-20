import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCustomEmojiStore } from '../../store/customEmojiStore'

const PRESET_EMOJIS = [
  '😀','😂','🥰','😎','🤔','😴','🥳','😤',
  '👍','👎','👏','🙌','🤝','💪','🫶','✌️',
  '❤️','🔥','⭐','💫','✨','🎉','🎊','🎯',
  '📝','📌','📎','🔖','💡','🔑','🗂️','📁',
  '✅','❌','⚠️','🚀','💻','🖥️','📱','🎨',
  '🏷️','📅','⏰','🔔','💬','📧','🌐','🔒',
]

interface EmojiPickerProps {
  anchorRef: React.RefObject<HTMLElement | null>
  onSelect: (icon: string) => void
  onClear: () => void
  onClose: () => void
}

export default function EmojiPicker({ anchorRef, onSelect, onClear, onClose }: EmojiPickerProps) {
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const { emojis: customEmojis, load, add, remove } = useCustomEmojiStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const pickerH = 320
    const pickerW = 280
    let top = rect.bottom + 4
    let left = rect.left
    if (top + pickerH > window.innerHeight - 8) top = rect.top - pickerH - 4
    if (left + pickerW > window.innerWidth - 8) left = window.innerWidth - pickerW - 8
    if (left < 4) left = 4
    setCoords({ top, left })
  }, [anchorRef])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  const filtered = search
    ? PRESET_EMOJIS.filter(e => e.includes(search))
    : PRESET_EMOJIS

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      // Electron File objects expose .path for the absolute filesystem path
      const filePath = (file as { path?: string }).path ?? ''
      if (!filePath) return
      const name = file.name.replace(/\.[^.]+$/, '')
      const emoji = await add(name, filePath)
      onSelect(`custom:${emoji.id}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return createPortal(
    <div
      ref={pickerRef}
      className="fixed z-[9999] rounded-xl shadow-xl border flex flex-col"
      style={{
        top: coords.top,
        left: coords.left,
        width: 280,
        maxHeight: 320,
        background: 'var(--app-bg)',
        borderColor: 'var(--app-border)',
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {/* search */}
      <div className="p-2 border-b" style={{ borderColor: 'var(--app-border)' }}>
        <input
          autoFocus
          className="w-full px-2 py-1 text-xs rounded-md outline-none"
          style={{ background: 'var(--app-hover)', color: 'var(--app-text)' }}
          placeholder="이모지 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* preset grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-0.5">
          {filtered.map(emoji => (
            <button
              key={emoji}
              className="text-base w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--app-hover)] transition-colors"
              onClick={() => { onSelect(emoji); onClose() }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* custom emoji section */}
        {customEmojis.length > 0 && (
          <>
            <div className="text-[10px] mt-2 mb-1 px-0.5" style={{ color: 'var(--app-text-muted)' }}>커스텀</div>
            <div className="grid grid-cols-8 gap-0.5">
              {customEmojis.map(ce => (
                <div key={ce.id} className="relative group w-7 h-7">
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--app-hover)] transition-colors overflow-hidden"
                    onClick={() => { onSelect(`custom:${ce.id}`); onClose() }}
                    title={ce.name}
                  >
                    <img src={`file://${ce.path}`} alt={ce.name} className="w-5 h-5 object-contain" />
                  </button>
                  <button
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] items-center justify-center hidden group-hover:flex"
                    style={{ background: 'var(--app-border)', color: 'var(--app-text)' }}
                    onClick={() => remove(ce.id)}
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* footer */}
      <div className="flex gap-1 p-1.5 border-t" style={{ borderColor: 'var(--app-border)' }}>
        <button
          className="flex-1 text-xs px-2 py-1 rounded-md hover:bg-[var(--app-hover)] transition-colors"
          style={{ color: 'var(--app-text-muted)' }}
          onClick={() => { onClear(); onClose() }}
        >
          아이콘 제거
        </button>
        <button
          className="flex-1 text-xs px-2 py-1 rounded-md hover:bg-[var(--app-hover)] transition-colors"
          style={{ color: 'var(--app-text-muted)' }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '업로드 중...' : '이미지 업로드'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    </div>,
    document.body
  )
}
