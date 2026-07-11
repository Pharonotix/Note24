import { useRef, useState } from 'react'
import { spliceAtCursor } from '../../lib/textInsert'
import styles from './MathKeyboard.module.css'

interface Sym {
  label: string
  insert: string
  /** Characters back from the end of `insert` where the caret should land. */
  caretBack?: number
  title?: string
}

const GREEK: Sym[] = [
  { label: 'α', insert: '\\alpha' },
  { label: 'β', insert: '\\beta' },
  { label: 'γ', insert: '\\gamma' },
  { label: 'δ', insert: '\\delta' },
  { label: 'ε', insert: '\\epsilon' },
  { label: 'ζ', insert: '\\zeta' },
  { label: 'η', insert: '\\eta' },
  { label: 'θ', insert: '\\theta' },
  { label: 'κ', insert: '\\kappa' },
  { label: 'λ', insert: '\\lambda' },
  { label: 'μ', insert: '\\mu' },
  { label: 'ν', insert: '\\nu' },
  { label: 'ξ', insert: '\\xi' },
  { label: 'π', insert: '\\pi' },
  { label: 'ρ', insert: '\\rho' },
  { label: 'σ', insert: '\\sigma' },
  { label: 'τ', insert: '\\tau' },
  { label: 'φ', insert: '\\phi' },
  { label: 'χ', insert: '\\chi' },
  { label: 'ψ', insert: '\\psi' },
  { label: 'ω', insert: '\\omega' },
  { label: 'Γ', insert: '\\Gamma' },
  { label: 'Δ', insert: '\\Delta' },
  { label: 'Θ', insert: '\\Theta' },
  { label: 'Λ', insert: '\\Lambda' },
  { label: 'Σ', insert: '\\Sigma' },
  { label: 'Φ', insert: '\\Phi' },
  { label: 'Ψ', insert: '\\Psi' },
  { label: 'Ω', insert: '\\Omega' }
]

const CALCULUS: Sym[] = [
  { label: '∫', insert: '\\int', title: 'Integral' },
  { label: '∬', insert: '\\iint', title: 'Double integral' },
  { label: '∮', insert: '\\oint', title: 'Contour integral' },
  { label: '∑', insert: '\\sum', title: 'Summation' },
  { label: '∏', insert: '\\prod', title: 'Product' },
  { label: '∂', insert: '\\partial', title: 'Partial derivative' },
  { label: '∇', insert: '\\nabla', title: 'Nabla / gradient' },
  { label: '√', insert: '\\sqrt{}', caretBack: 1, title: 'Square root' },
  { label: '∞', insert: '\\infty', title: 'Infinity' },
  { label: 'a/b', insert: '\\frac{}{}', caretBack: 3, title: 'Fraction' },
  { label: 'lim', insert: '\\lim_{x \\to }', caretBack: 1, title: 'Limit' },
  { label: 'd/dx', insert: '\\frac{d}{dx}', title: 'Derivative' }
]

const OPERATORS: Sym[] = [
  { label: '±', insert: '\\pm' },
  { label: '×', insert: '\\times' },
  { label: '÷', insert: '\\div' },
  { label: '·', insert: '\\cdot' },
  { label: '≤', insert: '\\leq' },
  { label: '≥', insert: '\\geq' },
  { label: '≠', insert: '\\neq' },
  { label: '≈', insert: '\\approx' },
  { label: '→', insert: '\\to' },
  { label: '⇌', insert: '\\rightleftharpoons', title: 'Chemical equilibrium' },
  { label: '°', insert: '^\\circ', title: 'Degree' },
  { label: '∈', insert: '\\in' },
  { label: '∀', insert: '\\forall' },
  { label: '∃', insert: '\\exists' }
]

const GROUPS: { label: string; symbols: Sym[] }[] = [
  { label: 'Greek', symbols: GREEK },
  { label: 'Calculus', symbols: CALCULUS },
  { label: 'Operators', symbols: OPERATORS }
]

/**
 * A symbol palette that inserts LaTeX snippets into a target textarea at the
 * current caret position. Used both by the equation library's add/edit form
 * and by in-note inline/block math editing.
 */
export function MathKeyboard({
  targetRef,
  value,
  onChange
}: {
  targetRef: React.RefObject<HTMLTextAreaElement | null>
  value: string
  onChange: (next: string) => void
}): React.JSX.Element {
  const [activeGroup, setActiveGroup] = useState(0)
  const pendingCaret = useRef<number | null>(null)

  const insert = (sym: Sym): void => {
    const el = targetRef.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const { value: next, cursor } = spliceAtCursor(value, start, end, sym.insert, sym.caretBack ?? 0)
    pendingCaret.current = cursor
    onChange(next)
    // Restore the caret after React re-renders the (now longer) value.
    requestAnimationFrame(() => {
      const c = pendingCaret.current
      if (c != null && targetRef.current) {
        targetRef.current.focus()
        targetRef.current.setSelectionRange(c, c)
      }
    })
  }

  return (
    <div className={styles.keyboard} onMouseDown={(e) => e.preventDefault()}>
      <div className={styles.tabs}>
        {GROUPS.map((g, i) => (
          <button
            key={g.label}
            className={i === activeGroup ? `${styles.tab} ${styles.tabOn}` : styles.tab}
            onClick={() => setActiveGroup(i)}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {GROUPS[activeGroup].symbols.map((sym) => (
          <button
            key={sym.insert}
            className={styles.key}
            title={sym.title ?? sym.insert}
            onClick={() => insert(sym)}
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  )
}
