import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/globals.css'
import { NoteEditor } from '../components/NoteEditor'
import type { Note } from '../../../../shared/types'

function NoteApp(): JSX.Element | null {
  const [note, setNote] = useState<Note | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (!id) return

    window.api.note.getAll().then((notes) => {
      const found = notes.find((n) => n.id === id)
      if (found) setNote(found)
    })

    const unsub = window.api.note.onUpdated((updated) => {
      if (updated.id === id) setNote(updated)
    })
    return unsub
  }, [])

  if (!note) return null
  return <NoteEditor note={note} onNoteChange={setNote} />
}

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <NoteApp />
  </StrictMode>
)
