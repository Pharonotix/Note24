/** Global keyboard shortcuts, customizable from Settings → Shortcuts. */

export type ShortcutAction =
  | 'newNote'
  | 'quickSwitcher'
  | 'equations'
  | 'fileManager'
  | 'study'
  | 'whiteboard'
  | 'settings'
  | 'readingMode'
  | 'focusMode'

export const ACTION_LABELS: Record<ShortcutAction, string> = {
  newNote: 'New note',
  quickSwitcher: 'Quick switcher',
  equations: 'Equation library',
  fileManager: 'File manager',
  study: 'Study panel',
  whiteboard: 'Infinite whiteboard',
  settings: 'Settings',
  readingMode: 'Toggle reading mode',
  focusMode: 'Toggle focus mode'
}

export const DEFAULT_SHORTCUTS: Record<ShortcutAction, string> = {
  newNote: 'ctrl+n',
  quickSwitcher: 'ctrl+o',
  equations: 'ctrl+e',
  fileManager: 'ctrl+shift+f',
  study: 'ctrl+shift+s',
  whiteboard: 'ctrl+shift+w',
  settings: 'ctrl+,',
  readingMode: 'ctrl+shift+r',
  focusMode: 'ctrl+shift+d'
}

/** Normalizes a combo like "Ctrl+Shift+F" to a canonical "ctrl+shift+f" string. */
export function normalizeCombo(combo: string): string {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean)
  const mods = ['ctrl', 'shift', 'alt', 'meta'].filter((m) => parts.includes(m))
  const key = parts.find((p) => !['ctrl', 'shift', 'alt', 'meta'].includes(p)) ?? ''
  return [...mods, key].join('+')
}

/** Builds the canonical combo string for a KeyboardEvent (for recording a new binding). */
export function comboFromEvent(e: KeyboardEvent | React.KeyboardEvent): string {
  const mods: string[] = []
  if (e.ctrlKey || e.metaKey) mods.push('ctrl')
  if (e.shiftKey) mods.push('shift')
  if (e.altKey) mods.push('alt')
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()
  if (['control', 'shift', 'alt', 'meta'].includes(key)) return ''
  return [...mods, key].join('+')
}

export function matchShortcut(e: KeyboardEvent, combo: string): boolean {
  if (!combo) return false
  return normalizeCombo(combo) === comboFromEvent(e)
}

export async function loadShortcuts(): Promise<Record<ShortcutAction, string>> {
  const raw = await window.api.settings.get('shortcuts')
  if (!raw) return DEFAULT_SHORTCUTS
  try {
    const parsed = JSON.parse(raw) as Partial<Record<ShortcutAction, string>>
    return { ...DEFAULT_SHORTCUTS, ...parsed }
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

export async function saveShortcuts(map: Record<ShortcutAction, string>): Promise<void> {
  await window.api.settings.set('shortcuts', JSON.stringify(map))
}
