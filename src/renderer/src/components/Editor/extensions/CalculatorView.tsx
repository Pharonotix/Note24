import { useEffect, useMemo, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import {
  CONSTANTS,
  evaluateLines,
  extractSymbols,
  loadCalcEngines,
  solveFor,
  type EvalOutput
} from '../../../lib/calcEngine'
import type { DesmosSeed } from '../../../lib/desmos'
import styles from './Calculator.module.css'

const DEFAULT_W = 460
const MIN_W = 280

type Engines = Awaited<ReturnType<typeof loadCalcEngines>>

export function CalculatorView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos
}: NodeViewProps): React.JSX.Element {
  const editable = editor.isEditable
  const attrW = (node.attrs.width as number) || DEFAULT_W
  const [width, setWidth] = useState(attrW)
  const [text, setText] = useState((node.attrs.text as string) || '')
  const [engines, setEngines] = useState<Engines | null>(null)
  const [engineError, setEngineError] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Panels / inspector.
  const [showVars, setShowVars] = useState(true)
  const [showRearrange, setShowRearrange] = useState(false)
  const [showConstants, setShowConstants] = useState(false)
  const [rearrEq, setRearrEq] = useState('')
  const [rearrVar, setRearrVar] = useState('')
  const [rearrResult, setRearrResult] = useState<string | null | undefined>(undefined)

  useEffect(() => setWidth(attrW), [attrW])

  useEffect(() => {
    let cancelled = false
    loadCalcEngines().then(
      (e) => !cancelled && setEngines(e),
      () => !cancelled && setEngineError(true)
    )
    return () => {
      cancelled = true
    }
  }, [])

  const evalOut: EvalOutput = useMemo(() => {
    if (!engines) return { results: [], variables: [] }
    try {
      return evaluateLines(text, engines.math, engines.nerdamer)
    } catch {
      return { results: [], variables: [] }
    }
  }, [text, engines])

  const onInput = (value: string): void => {
    setText(value)
    if (!editable) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => updateAttributes({ text: value }), 500)
  }

  const onResizeStart = (e: React.PointerEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startW = width
    let lw = startW
    const move = (ev: PointerEvent): void => {
      lw = Math.max(MIN_W, startW + (ev.clientX - startX))
      setWidth(lw)
    }
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      updateAttributes({ width: Math.round(lw) })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const symbols = useMemo(() => extractSymbols(rearrEq), [rearrEq])
  const effectiveVar = symbols.includes(rearrVar) ? rearrVar : (symbols[0] ?? '')

  const runRearrange = (): void => {
    if (!engines || !rearrEq.includes('=') || !effectiveVar) return
    setRearrResult(solveFor(rearrEq, effectiveVar, engines.nerdamer))
  }

  const insertRearrangement = (): void => {
    if (!rearrResult || !effectiveVar) return
    const line = `${effectiveVar} = ${rearrResult}`
    const next = text.trim() ? `${text.replace(/\n*$/, '')}\n${line}` : line
    onInput(next)
  }

  const lines = text.length ? text.split('\n') : ['']
  const rows = Math.max(3, lines.length)

  // Lines with a variable (letter) are treated as graphable expressions/equations.
  const graphableLines = lines.map((l) => l.trim()).filter((l) => l && /[a-zA-Z]/.test(l))

  const onGraph = (): void => {
    if (!graphableLines.length) return
    const from = getPos()
    if (from == null) return
    const seed: DesmosSeed = { kind: 'exprs', exprs: graphableLines }
    const pos = from + node.nodeSize
    editor
      .chain()
      .focus()
      .insertContentAt(pos, { type: 'desmos', attrs: { seed: JSON.stringify(seed) } })
      .run()
  }

  return (
    <NodeViewWrapper className={styles.wrap}>
      <div
        className={selected ? `${styles.frame} ${styles.sel}` : styles.frame}
        style={{ width }}
        contentEditable={false}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.icon}>🧮</span>
          <span className={styles.label}>Calculator</span>
          {!engines && !engineError && <span className={styles.loading}>loading…</span>}
          {engineError && <span className={styles.err}>engine failed to load</span>}
          {editable && (
            <>
              <button
                type="button"
                className={showRearrange ? `${styles.hbtn} ${styles.hbtnOn}` : styles.hbtn}
                title="Rearrange an equation (solve for a variable)"
                onClick={() => setShowRearrange((v) => !v)}
              >
                ⇄ Rearrange
              </button>
              <button
                type="button"
                className={showConstants ? `${styles.hbtn} ${styles.hbtnOn}` : styles.hbtn}
                title="Built-in constants"
                onClick={() => setShowConstants((v) => !v)}
              >
                π Constants
              </button>
              <button
                type="button"
                className={styles.hbtn}
                title={
                  graphableLines.length
                    ? 'Send these lines to a new Desmos graph'
                    : 'Add a line with a variable (e.g. y = x^2) to graph it'
                }
                disabled={!graphableLines.length}
                onClick={onGraph}
              >
                📈 Graph
              </button>
            </>
          )}
        </div>

        {showConstants && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Built-in constants (usable in any line)</div>
            <div className={styles.constGrid}>
              {CONSTANTS.map((c) => (
                <div key={c.name} className={styles.constItem}>
                  <span className={styles.constName}>{c.name}</span>
                  <span className={styles.constLabel}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRearrange && (
          <div className={styles.panel}>
            <div className={styles.panelTitle}>Rearrange — solve an equation for a variable</div>
            <input
              className={styles.panelInput}
              placeholder="Equation with =, e.g.  P*V = n*R*T"
              value={rearrEq}
              spellCheck={false}
              onChange={(e) => {
                setRearrEq(e.target.value)
                setRearrResult(undefined)
              }}
            />
            <div className={styles.panelRow}>
              <label className={styles.panelLabel}>solve for</label>
              <select
                className={styles.panelSelect}
                value={effectiveVar}
                onChange={(e) => {
                  setRearrVar(e.target.value)
                  setRearrResult(undefined)
                }}
              >
                {symbols.length === 0 && <option value="">—</option>}
                {symbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={styles.panelBtn}
                disabled={!engines || !rearrEq.includes('=') || !effectiveVar}
                onClick={runRearrange}
              >
                Solve
              </button>
            </div>
            {rearrResult != null && (
              <div className={styles.rearrOut}>
                <span className={styles.rearrExpr}>
                  {effectiveVar} = {rearrResult}
                </span>
                <button type="button" className={styles.rearrInsert} onClick={insertRearrangement}>
                  Insert as line
                </button>
              </div>
            )}
            {rearrResult === null && <div className={styles.rearrErr}>Couldn&apos;t solve for that variable.</div>}
          </div>
        )}

        <div className={styles.body}>
          <textarea
            className={styles.input}
            value={text}
            wrap="off"
            spellCheck={false}
            rows={rows}
            readOnly={!editable}
            placeholder={'2 + 2\n10 m / 2 s\nx = 5\nF = 5 kg * g\nsolve(x^2 - 4, x)'}
            onChange={(e) => onInput(e.target.value)}
          />
          <div className={styles.results} aria-hidden>
            {lines.map((_, i) => {
              const r = evalOut.results[i]
              return (
                <div key={i} className={styles.resultLine}>
                  {r?.result != null ? (
                    <span className={styles.resultVal}>= {r.result}</span>
                  ) : r?.warning ? (
                    <span className={styles.resultWarn}>⚠ {r.warning}</span>
                  ) : r?.failed ? (
                    <span className={styles.resultErr}>can&apos;t solve</span>
                  ) : (
                    <span />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {evalOut.variables.length > 0 && (
          <div className={styles.varsFooter}>
            <button
              type="button"
              className={styles.varsToggle}
              onClick={() => setShowVars((v) => !v)}
            >
              {showVars ? '▾' : '▸'} Variables ({evalOut.variables.length})
            </button>
            {showVars && (
              <div className={styles.varsList}>
                {evalOut.variables.map((v) => (
                  <span key={v.name} className={styles.varChip}>
                    <span className={styles.varName}>{v.name}</span> = {v.value}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
