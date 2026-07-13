import { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { applyDesmosSeed, type DesmosCalculator, getDesmosApiKey, loadDesmos } from '../../../lib/desmos'
import styles from './DesmosGraph.module.css'

const DEFAULT_W = 640
const DEFAULT_H = 380
const MIN_W = 260
const MIN_H = 200

export function DesmosGraph({
  node,
  updateAttributes,
  selected,
  editor
}: NodeViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const calcRef = useRef<DesmosCalculator | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const attrW = (node.attrs.width as number) || DEFAULT_W
  const attrH = (node.attrs.height as number) || DEFAULT_H
  const editable = editor.isEditable

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [editing, setEditing] = useState(false)
  const [size, setSize] = useState({ w: attrW, h: attrH })

  useEffect(() => {
    setSize({ w: attrW, h: attrH })
  }, [attrW, attrH])

  // Create the calculator once for this node instance.
  useEffect(() => {
    let cancelled = false
    const create = async (): Promise<void> => {
      try {
        const key = await getDesmosApiKey()
        const Desmos = await loadDesmos(key)
        if (cancelled || !containerRef.current) return
        const calc = Desmos.GraphingCalculator(containerRef.current, {
          expressions: false,
          settingsMenu: false,
          zoomButtons: true,
          lockViewport: false,
          border: false
        })
        calcRef.current = calc
        const raw = node.attrs.state as string
        if (raw) {
          try {
            calc.setState(JSON.parse(raw))
          } catch {
            /* ignore malformed state */
          }
        } else {
          const seedRaw = node.attrs.seed as string
          if (seedRaw) {
            try {
              applyDesmosSeed(calc, JSON.parse(seedRaw))
              updateAttributes({ state: JSON.stringify(calc.getState()), seed: '' })
            } catch {
              /* ignore malformed seed */
            }
          }
        }
        calc.observeEvent('change', () => {
          if (!editor.isEditable) return
          if (saveTimer.current) clearTimeout(saveTimer.current)
          saveTimer.current = setTimeout(() => {
            updateAttributes({ state: JSON.stringify(calc.getState()) })
          }, 700)
        })
        setStatus('ready')
      } catch (e) {
        if (cancelled) return
        setErrorMsg(e instanceof Error ? e.message : 'Failed to load Desmos')
        setStatus('error')
      }
    }
    create()
    return () => {
      cancelled = true
      if (saveTimer.current) clearTimeout(saveTimer.current)
      calcRef.current?.destroy()
      calcRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toggle the expression editor between view and edit modes.
  useEffect(() => {
    calcRef.current?.updateSettings({ expressions: editing, settingsMenu: editing })
  }, [editing, status])

  // Keep Desmos laid out to the current container size.
  useEffect(() => {
    calcRef.current?.resize()
  }, [size.w, size.h, status])

  const onResizeStart = (e: React.PointerEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    let lw = startW
    let lh = startH
    const move = (ev: PointerEvent): void => {
      lw = Math.max(MIN_W, startW + (ev.clientX - startX))
      lh = Math.max(MIN_H, startH + (ev.clientY - startY))
      setSize({ w: lw, h: lh })
    }
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      updateAttributes({ width: Math.round(lw), height: Math.round(lh) })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <NodeViewWrapper className={styles.wrap}>
      <div
        className={selected ? `${styles.frame} ${styles.sel}` : styles.frame}
        style={{ width: size.w, height: size.h }}
        contentEditable={false}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
        onDoubleClick={() => editable && setEditing((v) => !v)}
      >
        <div className={styles.calc} ref={containerRef} />

        {status !== 'ready' && (
          <div className={styles.overlay}>
            {status === 'loading' ? (
              <span>Loading Desmos…</span>
            ) : (
              <div className={styles.err}>
                <div>⚠ {errorMsg}</div>
                <div className={styles.hint}>Desmos requires an internet connection.</div>
              </div>
            )}
          </div>
        )}

        {editable && status === 'ready' && (
          <div className={styles.toolbar}>
            <button
              className={editing ? `${styles.tbtn} ${styles.tbtnOn}` : styles.tbtn}
              onClick={() => setEditing((v) => !v)}
              title="Toggle equation editor (or double-click the graph)"
            >
              {editing ? 'Done' : 'Edit graph'}
            </button>
          </div>
        )}

        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
