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
}

const SYMBOLIC_RE = /^\s*(solve|integrate)\s*\(/

/** For `solve(expr, x)` / `integrate(expr, x)`, returns the trailing variable
 * (`x`) — which must NOT be substituted, since it's the symbol being solved
 * for / integrated with respect to. */
function symbolicVariable(expr: string): string | null {
  const m = /,\s*([a-zA-Z]\w*)\s*\)\s*$/.exec(expr)
  return m ? m[1] : null
}

/**
 * Evaluates the calculator's text top-to-bottom with a fresh, per-block math.js
 * parser (persistent variable scope within the block). Returns one result per
 * line. Never throws — invalid/mid-typing lines yield a blank result; only a
 * failed symbolic call is flagged.
 */
export function evaluateLines(
  text: string,
  math: MathModule,
  nerdamer: NerdamerFn
): LineResult[] {
  const parser = math.parser()
  return text.split('\n').map((line) => {
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
        for (const [k, v] of Object.entries(scope)) {
          if (k !== excludeVar && typeof v === 'number') subs[k] = v
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
    } catch {
      // Incomplete or invalid arithmetic — stay quietly blank.
      return { result: null, failed: false }
    }
  })
}
