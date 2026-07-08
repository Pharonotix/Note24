/**
 * Loads the Desmos graphing engine (calculator.js) once from Desmos's servers
 * and hands back the global `Desmos` object. Requires an internet connection on
 * first load. The API key comes from settings (falling back to the public demo
 * key used for development).
 */

export const DEMO_API_KEY = 'dcb31709b452b1cf9dc26972add0fda6'
const DESMOS_VERSION = 'v1.12'

/** Minimal shape of a Desmos GraphingCalculator instance (only what we use). */
export interface DesmosCalculator {
  getState(): unknown
  setState(state: unknown, options?: { allowUndo?: boolean }): void
  setBlank(): void
  updateSettings(settings: Record<string, unknown>): void
  resize(): void
  observeEvent(event: string, handler: () => void): void
  unobserveEvent(event: string): void
  destroy(): void
}

interface DesmosStatic {
  GraphingCalculator(
    element: HTMLElement,
    options?: Record<string, unknown>
  ): DesmosCalculator
}

declare global {
  interface Window {
    Desmos?: DesmosStatic
  }
}

let loadPromise: Promise<DesmosStatic> | null = null

export function loadDesmos(apiKey: string): Promise<DesmosStatic> {
  if (window.Desmos) return Promise.resolve(window.Desmos)
  if (loadPromise) return loadPromise

  loadPromise = new Promise<DesmosStatic>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.desmos.com/api/${DESMOS_VERSION}/calculator.js?apiKey=${encodeURIComponent(apiKey)}`
    script.async = true
    script.onload = () => {
      if (window.Desmos) resolve(window.Desmos)
      else reject(new Error('Desmos loaded but global was not found'))
    }
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Desmos — check your internet connection'))
    }
    document.head.appendChild(script)
  })
  return loadPromise
}

/** Resolves the Desmos API key from settings, falling back to the demo key. */
export async function getDesmosApiKey(): Promise<string> {
  const key = await window.api.settings.get('desmosApiKey')
  return key && key.trim() ? key.trim() : DEMO_API_KEY
}
