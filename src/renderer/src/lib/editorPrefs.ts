/**
 * Editor typography preferences: font family + size scale. Applied as CSS custom
 * properties on :root (same pattern as theme.ts), so Editor.module.css just reads
 * var(--editor-font-family)/var(--editor-font-scale) — no React re-render needed to
 * repaint the editor when these change.
 */

export interface EditorPrefs {
  fontFamily: string
  /** Percent, 80-200. */
  fontSize: number
}

export const DEFAULT_EDITOR_PREFS: EditorPrefs = { fontFamily: 'system', fontSize: 100 }

export const FONT_OPTIONS: { id: string; label: string; stack: string }[] = [
  { id: 'system', label: 'System Default', stack: 'var(--font-ui)' },
  { id: 'inter', label: 'Inter', stack: '"Inter", var(--font-ui)' },
  { id: 'roboto', label: 'Roboto', stack: '"Roboto", var(--font-ui)' },
  { id: 'merriweather', label: 'Merriweather', stack: '"Merriweather", serif' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', stack: '"JetBrains Mono", var(--font-mono)' },
  { id: 'caveat', label: 'Caveat', stack: '"Caveat", cursive' }
]

export function applyEditorPrefs(prefs: EditorPrefs): void {
  const root = document.documentElement
  const font = FONT_OPTIONS.find((f) => f.id === prefs.fontFamily) ?? FONT_OPTIONS[0]
  root.style.setProperty('--editor-font-family', font.stack)
  root.style.setProperty('--editor-font-scale', String(Math.min(200, Math.max(80, prefs.fontSize)) / 100))
}

export async function loadEditorPrefs(): Promise<EditorPrefs> {
  const raw = await window.api.settings.get('editorPrefs')
  if (!raw) return DEFAULT_EDITOR_PREFS
  try {
    const parsed = JSON.parse(raw) as Partial<EditorPrefs>
    return {
      fontFamily: parsed.fontFamily || DEFAULT_EDITOR_PREFS.fontFamily,
      fontSize: parsed.fontSize || DEFAULT_EDITOR_PREFS.fontSize
    }
  } catch {
    return DEFAULT_EDITOR_PREFS
  }
}

export async function saveEditorPrefs(prefs: EditorPrefs): Promise<void> {
  await window.api.settings.set('editorPrefs', JSON.stringify(prefs))
}
