import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from '@/App.tsx'
import { loadCommands } from '@/features/command-config'

await loadCommands()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
