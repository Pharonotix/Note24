/**
 * Productivity workspace state: recently-viewed notes and open tabs. Both are small
 * arrays of note ids persisted under a settings key (same pattern as theme.ts /
 * editorPrefs.ts), separate from the DB since they're pure UI/navigation history, not
 * note content.
 */

const RECENT_KEY = 'recentNoteIds'
const TABS_KEY = 'openTabs'
const MAX_RECENT = 12

export async function loadRecentNoteIds(): Promise<number[]> {
  const raw = await window.api.settings.get(RECENT_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

/** Pushes `id` to the front of the recent list, de-duplicating and capping length. */
export function pushRecent(current: number[], id: number): number[] {
  const next = [id, ...current.filter((n) => n !== id)]
  return next.slice(0, MAX_RECENT)
}

export async function saveRecentNoteIds(ids: number[]): Promise<void> {
  await window.api.settings.set(RECENT_KEY, JSON.stringify(ids))
}

export async function loadOpenTabs(): Promise<number[]> {
  const raw = await window.api.settings.get(TABS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

export async function saveOpenTabs(ids: number[]): Promise<void> {
  await window.api.settings.set(TABS_KEY, JSON.stringify(ids))
}

/** Named quick-actions for common workflows — the app has one docked side-panel slot,
 *  so a "layout preset" here means "jump straight into this workflow's panel/mode"
 *  rather than arranging multiple panes at once. */
export interface LayoutPreset {
  id: string
  label: string
  description: string
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: 'study', label: 'Study', description: 'Opens flashcards & the formula sheet' },
  { id: 'homework', label: 'Homework', description: 'Opens the equation library' },
  { id: 'research', label: 'Research', description: 'Opens the citation library' },
  { id: 'lab', label: 'Lab', description: 'Opens files & the equation library' }
]
