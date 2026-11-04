import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../styles/globals.css'
import { MainPanel } from '../components/MainPanel'

const root = document.getElementById('root')!
createRoot(root).render(
  <StrictMode>
    <MainPanel />
  </StrictMode>
)
