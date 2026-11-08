import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Root from './ui/v2/root'
import { applySettings } from './ui/settings'

applySettings()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
