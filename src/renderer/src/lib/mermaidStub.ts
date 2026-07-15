/**
 * Build-time stub for `@excalidraw/mermaid-to-excalidraw` (aliased in
 * electron.vite.config.ts). Excalidraw lazily imports that package for its
 * text-to-diagram dialog (which Note24 never renders) and for pasting
 * mermaid-syntax text onto the canvas. The real package drags ~10MB of
 * mermaid/diagram chunks into every build; with this stub, pasting mermaid
 * text falls back to plain text (Excalidraw catches the throw and logs a
 * warning — the same path a mermaid syntax error takes).
 */
export function parseMermaidToExcalidraw(): never {
  throw new Error('Mermaid support is not bundled with Note24')
}

export default { parseMermaidToExcalidraw }
