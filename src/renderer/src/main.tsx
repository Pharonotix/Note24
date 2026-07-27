import './styles/global.css'
import 'katex/dist/katex.min.css'

// Self-hosted editor font choices (Settings → Editor). Imported eagerly but cheap: a
// @font-face CSS import doesn't force a download, only referencing the family in
// rendered text does — so this doesn't slow startup for users who stick with System.
import '@fontsource/inter/400.css'
import '@fontsource/inter/700.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/700.css'
import '@fontsource/merriweather/400.css'
import '@fontsource/merriweather/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/caveat/400.css'
import '@fontsource/caveat/700.css'

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
