/**
 * Lazy-loaded math engines for the calculator block.
 * - math.js handles arithmetic, unit-aware expressions, variables, and its own
 *   built-in derivative()/simplify().
 * - nerdamer (the `all.min` bundle, which includes Algebra/Calculus/Solve in one
 *   module — avoiding cross-module singleton issues in the bundler) handles the
 *   two things math.js can't: solve() and integrate().
 * Both load only when a calculator block first renders.
 */

type MathModule = typeof import('mathjs')
type NerdamerFn = (expr: string, subs?: Record<string, unknown>) => { toString(): string }

let enginesPromise: Promise<{ math: MathModule; nerdamer: NerdamerFn }> | null = null

export function loadCalcEngines(): Promise<{ math: MathModule; nerdamer: NerdamerFn }> {
  if (!enginesPromise) {
    enginesPromise = Promise.all([import('mathjs'), import('nerdamer/all.min')]).then(
      ([math, nd]) => ({
        math: math as MathModule,
        nerdamer: (nd.default ?? (nd as unknown as NerdamerFn)) as NerdamerFn
      })
    )
  }
  return enginesPromise
}

export interface LineResult {
  /** Formatted result to show, or null for blank/comment/incomplete lines. */
  result: string | null
  /** True only for a symbolic solve/integrate that failed — shows "can't solve". */
  failed: boolean
  /** Set when a line has a genuine unit/dimension mismatch (e.g. `5 m + 3 s`). */
  warning?: string
}

/** A variable defined in a block's scope, for the inspector. */
export interface CalcVar {
  name: string
  value: string
}

export interface EvalOutput {
  results: LineResult[]
  variables: CalcVar[]
}

/**
 * Engineering constants seeded into every block's scope (the roadmap's set).
 * Values reuse math.js's built-in physical constants where they exist (so they
 * carry correct units); standard gravity has no math.js constant, so it's given
 * explicitly. Each is a math.js expression evaluated into the parser.
 */
export const CONSTANTS: { name: string; expr: string; label: string }[] = [
  { name: 'g', expr: '9.80665 m/s^2', label: 'standard gravity' },
  { name: 'G', expr: 'gravitationConstant', label: 'gravitational constant' },
  { name: 'c', expr: 'speedOfLight', label: 'speed of light' },
  { name: 'h', expr: 'planckConstant', label: 'Planck constant' },
  { name: 'R', expr: 'gasConstant', label: 'gas constant' },
  { name: 'k', expr: 'boltzmann', label: 'Boltzmann constant' },
  { name: 'mu0', expr: 'magneticConstant', label: 'vacuum permeability (μ₀)' },
  { name: 'epsilon0', expr: 'electricConstant', label: 'vacuum permittivity (ε₀)' }
]
export const CONSTANT_NAMES: Set<string> = new Set(CONSTANTS.map((c) => c.name))

const SYMBOLIC_RE = /^\s*(solve|integrate)\s*\(/
const UNIT_MISMATCH_RE = /units?\s+do not match|dimension/i

/** For `solve(expr, x)` / `integrate(expr, x)`, returns the trailing variable
 * (`x`) — which must NOT be substituted, since it's the symbol being solved
 * for / integrated with respect to. */
function symbolicVariable(expr: string): string | null {
  const m = /,\s*([a-zA-Z]\w*)\s*\)\s*$/.exec(expr)
  return m ? m[1] : null
}

/**
 * Evaluates the calculator's text top-to-bottom with a fresh, per-block math.js
 * parser (persistent variable scope within the block, pre-seeded with the
 * engineering constants). Returns one result per line plus the block's final
 * variable scope. Never throws — invalid/mid-typing lines yield a blank result;
 * a failed symbolic call is flagged, and a genuine unit mismatch is warned.
 */
export function evaluateLines(text: string, math: MathModule, nerdamer: NerdamerFn): EvalOutput {
  const parser = math.parser()

  // Seed engineering constants first so user lines can reference them; a user
  // assignment to the same name later in the block simply overrides it.
  for (const c of CONSTANTS) {
    try {
      parser.evaluate(`${c.name} = ${c.expr}`)
    } catch {
      // A constant math.js doesn't recognise is skipped rather than fatal.
    }
  }

  const results: LineResult[] = text.split('\n').map((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      return { result: null, failed: false }
    }

    if (SYMBOLIC_RE.test(trimmed)) {
      try {
        // Substitute numeric variables already defined in this block, but never
        // the variable being solved for / integrated with respect to.
        const excludeVar = symbolicVariable(trimmed)
        const scope = parser.getAll() as Record<string, unknown>
        const subs: Record<string, unknown> = {}
        for (const [key, v] of Object.entries(scope)) {
          if (key !== excludeVar && typeof v === 'number') subs[key] = v
        }
        const out = nerdamer(trimmed, subs).toString()
        return { result: out, failed: false }
      } catch {
        return { result: null, failed: true }
      }
    }

    try {
      const val = parser.evaluate(trimmed)
      if (val === undefined || typeof val === 'function') return { result: null, failed: false }
      const formatted =
        typeof val === 'number' ? String(val) : math.format(val, { precision: 12 })
      return { result: formatted, failed: false }
    } catch (e) {
      // A genuine dimensional error (e.g. `5 m + 3 s`) is worth surfacing; every
      // other error (mid-typing, unknown symbol) stays quietly blank as before.
      const msg = e instanceof Error ? e.message : ''
      if (UNIT_MISMATCH_RE.test(msg)) return { result: null, failed: false, warning: 'unit mismatch' }
      return { result: null, failed: false }
    }
  })

  // Final scope → inspector variables (excluding seeded constants and functions).
  const scope = parser.getAll() as Record<string, unknown>
  const variables: CalcVar[] = []
  for (const [name, val] of Object.entries(scope)) {
    if (CONSTANT_NAMES.has(name) || typeof val === 'function' || val === undefined) continue
    const value = typeof val === 'number' ? String(val) : math.format(val, { precision: 12 })
    variables.push({ name, value })
  }

  return { results, variables }
}

const RESERVED = new Set([
  'solve',
  'integrate',
  'derivative',
  'simplify',
  'sqrt',
  'sin',
  'cos',
  'tan',
  'log',
  'ln',
  'exp',
  'abs',
  'pi',
  'e'
])

/** Distinct identifier symbols in an expression, minus known functions/keywords —
 * used to populate the rearrangement wizard's "solve for" choices. */
export function extractSymbols(expr: string): string[] {
  const ids = expr.match(/[a-zA-Z_]\w*/g) ?? []
  return [...new Set(ids)].filter((s) => !RESERVED.has(s))
}

/**
 * Rearrangement wizard: isolates `variable` in an equation written with `=`,
 * via nerdamer's solver. Returns the isolated expression (or a comma-joined list
 * for multiple roots), or null if it can't be solved.
 */
export function solveFor(equation: string, variable: string, nerdamer: NerdamerFn): string | null {
  const v = variable.trim()
  if (!equation.includes('=') || !v) return null
  const [lhs, rhs] = equation.split('=')
  if (!lhs.trim() || rhs === undefined || !rhs.trim()) return null
  try {
    const out = nerdamer(`solve(${lhs}-(${rhs}), ${v})`).toString()
    const inner = out.replace(/^\[/, '').replace(/\]$/, '').trim()
    return inner || null
  } catch {
    return null
  }
}
