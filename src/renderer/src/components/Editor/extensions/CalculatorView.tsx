import { useEffect, useMemo, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { evaluateLines, loadCalcEngines, type LineResult } from '../../../lib/calcEngine'
import styles from './Calculator.module.css'

const DEFAULT_W = 460
const MIN_W = 280

type Engines = Awaited<ReturnType<typeof loadCalcEngines>>

export function CalculatorView({
  node,
  updateAttributes,
  selected,
  editor
}: NodeViewProps): React.JSX.Element {
  const editable = editor.isEditable
  const attrW = (node.attrs.width as number) || DEFAULT_W
  const [width, setWidth] = useState(attrW)
  const [text, setText] = useState((node.attrs.text as string) || '')
  const [engines, setEngines] = useState<Engines | null>(null)
  const [engineError, setEngineError] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const results: LineResult[] = useMemo(() => {
    if (!engines) return []
    try {
      return evaluateLines(text, engines.math, engines.nerdamer)
    } catch {
      return []
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

  const lines = text.length ? text.split('\n') : ['']
  const rows = Math.max(3, lines.length)

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
        </div>
        <div className={styles.body}>
          <textarea
            className={styles.input}
            value={text}
            wrap="off"
            spellCheck={false}
            rows={rows}
            readOnly={!editable}
            placeholder={'2 + 2\n10 m / 2 s\nx = 5\nsolve(x^2 - 4, x)'}
            onChange={(e) => onInput(e.target.value)}
          />
          <div className={styles.results} aria-hidden>
            {lines.map((_, i) => {
              const r = results[i]
              return (
                <div key={i} className={styles.resultLine}>
                  {r?.result != null ? (
                    <span className={styles.resultVal}>= {r.result}</span>
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
        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
