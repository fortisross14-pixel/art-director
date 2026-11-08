import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Root from './ui/v2/root'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
