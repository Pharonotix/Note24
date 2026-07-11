import type { EquationVariable } from '@shared/types'

/** Serializes variable definitions to the editable "symbol | meaning | unit" text format. */
export function serializeVars(vars: EquationVariable[]): string {
  return vars.map((v) => [v.symbol, v.meaning, v.unit ?? ''].join(' | ')).join('\n')
}

/** Parses the "symbol | meaning | unit" per-line text format back into variable definitions. */
export function parseVars(text: string): EquationVariable[] {
  return text
    .split('\n')
    .map((line) => line.split('|').map((p) => p.trim()))
    .filter((parts) => parts[0])
    .map((parts) => ({ symbol: parts[0], meaning: parts[1] ?? '', unit: parts[2] || undefined }))
}
