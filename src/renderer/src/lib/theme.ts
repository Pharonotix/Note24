/**
 * Theme engine. Presets live in styles/theme.css as `[data-theme=…]` blocks;
 * this module selects a preset and layers per-token overrides (primary/secondary
 * pickers + the advanced RGB editor) as inline CSS variables on :root. The whole
 * UI is driven by these variables, so changes apply live.
 */

export interface ThemeConfig {
  preset: string
  overrides: Record<string, string>
}

export interface PresetMeta {
  id: string
  label: string
  dark: boolean
  bg: string
  accent: string
}

export const PRESETS: PresetMeta[] = [
  { id: 'sage-dark', label: 'Sage Dark', dark: true, bg: '#1a1c1e', accent: '#7fb08a' },
  { id: 'forest-dark', label: 'Forest Dark', dark: true, bg: '#141a16', accent: '#6fbf8b' },
  { id: 'graphite-dark', label: 'Graphite Dark', dark: true, bg: '#1b1c1e', accent: '#8bbf9a' },
  { id: 'slate-dark', label: 'Slate Dark', dark: true, bg: '#171a1e', accent: '#7fb0c8' },
  { id: 'sage-light', label: 'Sage Light', dark: false, bg: '#f6f7f4', accent: '#4f8c5e' },
  { id: 'mist-light', label: 'Mist Light', dark: false, bg: '#f2f4f6', accent: '#4f8c5e' },
  { id: 'warm-light', label: 'Warm Light', dark: false, bg: '#f6f4ef', accent: '#5b8c62' }
]

/** Tokens exposed in the advanced RGB editor. */
export const ADVANCED_TOKENS: { key: string; label: string }[] = [
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'surface-2', label: 'Surface 2' },
  { key: 'surface-3', label: 'Surface 3' },
  { key: 'border', label: 'Border' },
  { key: 'border-strong', label: 'Border (strong)' },
  { key: 'text', label: 'Text' },
  { key: 'text-muted', label: 'Text muted' },
  { key: 'text-faint', label: 'Text faint' },
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'highlight', label: 'Highlight' }
]

// Every token the theme may override (cleared before re-applying).
const OVERRIDABLE = [
  'primary',
  'primary-hover',
  'primary-contrast',
  'secondary',
  'secondary-hover',
  'secondary-contrast',
  'bg',
  'surface',
  'surface-2',
  'surface-3',
  'border',
  'border-strong',
  'text',
  'text-muted',
  'text-faint',
  'danger',
  'highlight'
]

export const DEFAULT_THEME: ThemeConfig = { preset: 'sage-dark', overrides: {} }

/** Applies a theme config to the document (live). */
export function applyTheme(cfg: ThemeConfig): void {
  const root = document.documentElement
  for (const t of OVERRIDABLE) root.style.removeProperty(`--${t}`)
  root.setAttribute('data-theme', cfg.preset)
  for (const [k, v] of Object.entries(cfg.overrides ?? {})) {
    if (v) root.style.setProperty(`--${k}`, v)
  }
}

/** Reads the effective value of a token (override or preset). */
export function readToken(key: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${key}`).trim()
}

export async function loadTheme(): Promise<ThemeConfig> {
  const raw = await window.api.settings.get('theme')
  if (!raw) return DEFAULT_THEME
  try {
    const cfg = JSON.parse(raw) as ThemeConfig
    return { preset: cfg.preset || 'sage-dark', overrides: cfg.overrides || {} }
  } catch {
    return DEFAULT_THEME
  }
}

export async function saveTheme(cfg: ThemeConfig): Promise<void> {
  await window.api.settings.set('theme', JSON.stringify(cfg))
}

/* ---- color helpers (for deriving hover/contrast when picking primary) ---- */

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function contrastOn(hex: string): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#ffffff'
  const [r, g, b] = rgb
  // Relative luminance (sRGB approximation).
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.58 ? '#12140f' : '#ffffff'
}

/** Slightly lightens a hex color for hover states. */
export function lighten(hex: string, amount = 0.12): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const mix = (c: number): number => Math.round(c + (255 - c) * amount)
  const [r, g, b] = rgb.map(mix)
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

export function rgbToHex(value: string): string {
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v
  const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(v)
  if (m) {
    const [r, g, b] = [m[1], m[2], m[3]].map((x) => Number(x))
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`
  }
  return '#000000'
}
