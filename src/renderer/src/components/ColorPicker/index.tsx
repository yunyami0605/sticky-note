import type { NoteColor } from '../../../../shared/types'

const COLORS: { value: NoteColor; bg: string; label: string }[] = [
  { value: 'yellow', bg: 'bg-yellow-300', label: '노랑' },
  { value: 'blue',   bg: 'bg-blue-300',   label: '파랑' },
  { value: 'green',  bg: 'bg-green-300',  label: '초록' },
  { value: 'pink',   bg: 'bg-pink-300',   label: '핑크' },
  { value: 'purple', bg: 'bg-purple-300', label: '보라' },
  { value: 'white',  bg: 'bg-gray-200',   label: '흰색' },
]

interface Props {
  value: NoteColor
  onChange: (color: NoteColor) => void
  dark?: boolean
}

export function ColorPicker({ value, onChange, dark }: Props): JSX.Element {
  return (
    <div className="flex gap-1.5 items-center">
      {COLORS.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          className={`w-4 h-4 rounded-full ${c.bg} transition-transform hover:scale-110 ${
            value === c.value
              ? `ring-2 ring-offset-1 scale-110 ${dark ? 'ring-white/60 ring-offset-transparent' : 'ring-gray-500'}`
              : ''
          }`}
        />
      ))}
    </div>
  )
}
