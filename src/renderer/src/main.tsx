import './styles/global.css'
import 'katex/dist/katex.min.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

;(window as unknown as { EXCALIDRAW_ASSET_PATH: string }).EXCALIDRAW_ASSET_PATH = new URL(
  '.',
  window.location.href
).href

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
