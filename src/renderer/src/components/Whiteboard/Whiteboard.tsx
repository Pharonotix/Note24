import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Sigma, StickyNote, Workflow, X } from 'lucide-react'
import type { Equation, NoteSummary } from '@shared/types'
import { useStore } from '../../store/store'
import { isDarkPreset } from '../../lib/theme'
import { renderLatex } from '../../lib/katex'
import { openAttachment } from '../../lib/openAttachment'
import { ExcalidrawCanvas } from '../ExcalidrawCanvas'
import { GraphCard } from './GraphCard'
import styles from './Whiteboard.module.css'

const SETTINGS_KEY = 'whiteboard'

type Card =
  | { id: string; type: 'note'; x: number; y: number; noteId: number; title: string }
  | { id: string; type: 'equation'; x: number; y: number; name: string; latex: string }
  | { id: string; type: 'pdf'; x: number; y: number; attachmentId: string; filename: string }
  | { id: string; type: 'graph'; x: number; y: number; state: string }

interface WhiteboardData {
  scene: { elements: unknown[]; files: Record<string, unknown> }
  cards: Card[]
}

const EMPTY: WhiteboardData = { scene: { elements: [], files: {} }, cards: [] }

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Picks a note/equation/PDF attachment to drop onto the board. */
function Picker<T>({
  items,
  label,
  onPick,
  onClose
}: {
  items: { id: T; label: string; sub?: string }[]
  label: string
  onPick: (id: T) => void
  onClose: () => void
}): React.JSX.Element {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((i) => i.label.toLowerCase().includes(s) || i.sub?.toLowerCase().includes(s))
  }, [items, q])

  return (
    <div className={styles.pickerOverlay} onMouseDown={onClose}>
      <div className={styles.picker} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.pickerHead}>
          <span>{label}</span>
          <button className={styles.pickerClose} onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <input
          autoFocus
          className={styles.pickerSearch}
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className={styles.pickerList}>
          {filtered.map((i, idx) => (
            <button key={idx} className={styles.pickerItem} onClick={() => onPick(i.id)}>
              <div className={styles.pickerItemLabel}>{i.label || 'Untitled'}</div>
              {i.sub && <div className={styles.pickerItemSub}>{i.sub}</div>}
            </button>
          ))}
          {filtered.length === 0 && <div className={styles.pickerEmpty}>No results.</div>}
        </div>
      </div>
    </div>
  )
}

export function Whiteboard(): React.JSX.Element | null {
  const open = useStore((s) => s.whiteboardOpen)
  const setOpen = useStore((s) => s.setWhiteboardOpen)
  const selectNote = useStore((s) => s.selectNote)
  const dark = useStore((s) => isDarkPreset(s.theme.preset))
  // Stable reference: an inline object literal here would give Excalidraw a "new" props
  // value every render, which is worth avoiding now that this component re-renders on
  // pan/zoom (see the transform-state comment below).
  const uiOptions = useMemo(() => ({ canvasActions: { toggleTheme: false, saveToActiveFile: false, loadScene: false } }), [])

  // `cards` is the only reactive part of the board — it's what gets rendered as overlay
  // DOM elements, so it needs real React state. The Excalidraw *scene* (elements/files)
  // deliberately does NOT live in React state: Excalidraw manages its own canvas
  // rendering internally, and looping scene data back through this component's state on
  // every onChange event (which fires very frequently) created a synchronous re-render
  // ping-pong with Excalidraw and crashed with React error #185 (max update depth) during
  // testing. `sceneRef` holds the latest scene purely so it can be written to disk.
  const [cards, setCards] = useState<Card[]>([])
  const sceneRef = useRef<WhiteboardData['scene']>(EMPTY.scene)
  // Excalidraw's `initialData` prop is read once at mount, not reactively — feeding it
  // from `data.scene` (which onChange keeps rewriting) creates an update loop: new prop
  // object → Excalidraw treats it as a fresh scene → fires onChange → setData → re-render
  // → new prop object → ... (React error #185, confirmed via console during testing).
  // Keeping it in separate state, set once when a board loads, breaks that cycle.
  const [initialScene, setInitialScene] = useState(EMPTY.scene)
  const [loaded, setLoaded] = useState(false)
  // Excalidraw is given an explicit pixel size (measured via ResizeObserver) rather than
  // a flex-computed one — matching the DrawingView block's known-working pattern. A
  // fluid flex container reportedly can feed back into Excalidraw's own internal resize
  // handling (confirmed via a React #185 "maximum update depth" crash in testing).
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 })
  const [transform, setTransform] = useState({ scrollX: 0, scrollY: 0, zoom: 1 })
  // Root cause of a React error #185 (max update depth) found in testing: Excalidraw's
  // onChange fires very rapidly during any interaction, and calling setTransform
  // synchronously from inside it — a real, unconditional state update — let it cascade
  // into a same-tick render loop with Excalidraw's own internal reflow. Coalescing to at
  // most one setTransform per animation frame (and skipping the rAF entirely if nothing's
  // pending) breaks that cascade; the overlay cards only need frame-rate positioning
  // anyway, not to update on every single onChange call.
  const pendingTransform = useRef<{ scrollX: number; scrollY: number; zoom: number } | null>(null)
  const transformRaf = useRef<number | null>(null)
  const [picking, setPicking] = useState<'note' | 'equation' | 'pdf' | null>(null)
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [equations, setEquations] = useState<Equation[]>([])
  const [pdfAttachments, setPdfAttachments] = useState<{ id: string; filename: string }[]>([])
  const cardsRef = useRef(cards)
  cardsRef.current = cards
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const writeToDisk = (): void => {
    window.api.settings.set(SETTINGS_KEY, JSON.stringify({ scene: sceneRef.current, cards: cardsRef.current }))
  }
  const scheduleSave = (): void => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(writeToDisk, 800)
  }

  useEffect(() => {
    if (!open) return
    setLoaded(false)
    window.api.settings.get(SETTINGS_KEY).then((raw) => {
      let next: WhiteboardData = EMPTY
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          next = { scene: parsed.scene ?? EMPTY.scene, cards: parsed.cards ?? [] }
        } catch {
          next = EMPTY
        }
      }
      sceneRef.current = next.scene
      setInitialScene(next.scene)
      setCards(next.cards)
      setLoaded(true)
    })
    return () => {
      if (transformRaf.current != null) cancelAnimationFrame(transformRaf.current)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        writeToDisk()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!open || !containerRef.current) return
    const el = containerRef.current
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      const w = Math.round(r.width)
      const h = Math.round(r.height)
      // Bail out on a no-op size (same values, new object) — ResizeObserver can fire
      // repeatedly for sub-pixel reasons, and setState with a "new" object even when
      // the values are unchanged still forces a re-render every time.
      setCanvasSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [open])

  if (!open) return null

  // Deliberately does not call any React state setter — only writes into refs and
  // schedules a disk save (see the `cards`/`sceneRef` comment above). `transform` is the
  // one exception: it drives the overlay cards' on-screen position, so it does need to
  // be state, but updating it doesn't feed back into any prop Excalidraw itself reads.
  const onSceneChange = (elements: readonly unknown[], appState: unknown, files: unknown): void => {
    const s = appState as { scrollX: number; scrollY: number; zoom: { value: number } }
    pendingTransform.current = { scrollX: s.scrollX, scrollY: s.scrollY, zoom: s.zoom.value }
    if (transformRaf.current == null) {
      transformRaf.current = requestAnimationFrame(() => {
        transformRaf.current = null
        if (pendingTransform.current) setTransform(pendingTransform.current)
      })
    }
    sceneRef.current = { elements: [...elements], files: files as Record<string, unknown> }
    scheduleSave()
  }

  // Scene → screen coordinate transform (Excalidraw convention).
  const toScreen = (x: number, y: number): { left: number; top: number } => ({
    left: (x + transform.scrollX) * transform.zoom,
    top: (y + transform.scrollY) * transform.zoom
  })
  const centerInScene = (): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect()
    const w = rect?.width ?? 900
    const h = rect?.height ?? 600
    return { x: w / 2 / transform.zoom - transform.scrollX, y: h / 2 / transform.zoom - transform.scrollY }
  }

  const addCard = (card: Card): void => {
    setCards((c) => [...c, card])
    scheduleSave()
  }

  const openPicker = async (kind: 'note' | 'equation' | 'pdf'): Promise<void> => {
    if (kind === 'note') setNotes(await window.api.notes.list())
    if (kind === 'equation') setEquations(await window.api.equations.list())
    if (kind === 'pdf') {
      const atts = await window.api.attachments.list()
      setPdfAttachments(atts.filter((a) => a.mime === 'application/pdf'))
    }
    setPicking(kind)
  }

  const addGraphCard = (): void => {
    const c = centerInScene()
    addCard({ id: newId(), type: 'graph', x: c.x, y: c.y, state: '' })
  }

  const moveCard = (id: string, e: React.PointerEvent): void => {
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const card = cardsRef.current.find((c) => c.id === id)
    if (!card) return
    const startCX = card.x
    const startCY = card.y
    const move = (ev: PointerEvent): void => {
      const dx = (ev.clientX - startX) / transform.zoom
      const dy = (ev.clientY - startY) / transform.zoom
      setCards((cs) => cs.map((c) => (c.id === id ? { ...c, x: startCX + dx, y: startCY + dy } : c)))
    }
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      scheduleSave()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const removeCard = (id: string): void => {
    setCards((cs) => cs.filter((c) => c.id !== id))
    scheduleSave()
  }

  const updateGraphState = (id: string, state: string): void => {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, state } : c)))
    scheduleSave()
  }

  return (
    <div className={styles.host}>
      <div className={styles.toolbar}>
        <button className={styles.tbtn} onClick={() => openPicker('note')}>
          <StickyNote size={14} /> Note
        </button>
        <button className={styles.tbtn} onClick={() => openPicker('equation')}>
          <Sigma size={14} /> Equation
        </button>
        <button className={styles.tbtn} onClick={() => openPicker('pdf')}>
          <FileText size={14} /> PDF
        </button>
        <button className={styles.tbtn} onClick={addGraphCard}>
          <Workflow size={14} /> Graph
        </button>
        <span className={styles.spacer} />
        <button className={styles.close} onClick={() => setOpen(false)} title="Close whiteboard">
          <X size={16} /> Close
        </button>
      </div>

      <div className={styles.canvasHost} ref={containerRef}>
        {loaded && (
          <div style={{ width: canvasSize.w, height: canvasSize.h }}>
            <Suspense fallback={<div className={styles.loading}>Loading whiteboard…</div>}>
              <ExcalidrawCanvas
                initialData={{ elements: initialScene.elements as never[], files: initialScene.files as never, scrollToContent: true }}
                onChange={onSceneChange}
                theme={dark ? 'dark' : 'light'}
                UIOptions={uiOptions}
              />
            </Suspense>
          </div>
        )}

        <div className={styles.overlay}>
          {cards.map((card) => {
            const pos = toScreen(card.x, card.y)
            const style = { left: pos.left, top: pos.top, transform: `scale(${transform.zoom})`, transformOrigin: 'top left' }
            if (card.type === 'note') {
              return (
                <div key={card.id} className={styles.card} style={style}>
                  <div className={styles.cardHead} onPointerDown={(e) => moveCard(card.id, e)}>
                    <StickyNote size={12} />
                    <button className={styles.cardX} onClick={() => removeCard(card.id)}>
                      <X size={11} />
                    </button>
                  </div>
                  <button
                    className={styles.cardBody}
                    onClick={() => {
                      setOpen(false)
                      selectNote(card.noteId)
                    }}
                  >
                    {card.title || 'Untitled'}
                  </button>
                </div>
              )
            }
            if (card.type === 'equation') {
              const { html } = renderLatex(card.latex, false)
              return (
                <div key={card.id} className={styles.card} style={style}>
                  <div className={styles.cardHead} onPointerDown={(e) => moveCard(card.id, e)}>
                    <Sigma size={12} />
                    <button className={styles.cardX} onClick={() => removeCard(card.id)}>
                      <X size={11} />
                    </button>
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.eqName}>{card.name}</div>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                </div>
              )
            }
            if (card.type === 'pdf') {
              return (
                <div key={card.id} className={styles.card} style={style}>
                  <div className={styles.cardHead} onPointerDown={(e) => moveCard(card.id, e)}>
                    <FileText size={12} />
                    <button className={styles.cardX} onClick={() => removeCard(card.id)}>
                      <X size={11} />
                    </button>
                  </div>
                  <button
                    className={styles.cardBody}
                    onClick={() => openAttachment({ id: card.attachmentId, filename: card.filename, mime: 'application/pdf' })}
                  >
                    {card.filename}
                  </button>
                </div>
              )
            }
            return (
              <div key={card.id} className={`${styles.card} ${styles.graphCard}`} style={style}>
                <div className={styles.cardHead} onPointerDown={(e) => moveCard(card.id, e)}>
                  <Workflow size={12} />
                  <button className={styles.cardX} onClick={() => removeCard(card.id)}>
                    <X size={11} />
                  </button>
                </div>
                <div className={styles.graphBody}>
                  <GraphCard state={card.state} onChange={(s) => updateGraphState(card.id, s)} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {picking === 'note' && (
        <Picker
          label="Add a note"
          items={notes.map((n) => ({ id: n.id, label: n.title }))}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            const note = notes.find((n) => n.id === id)
            if (note) {
              const c = centerInScene()
              addCard({ id: newId(), type: 'note', x: c.x, y: c.y, noteId: note.id, title: note.title })
            }
            setPicking(null)
          }}
        />
      )}
      {picking === 'equation' && (
        <Picker
          label="Add an equation"
          items={equations.map((e) => ({ id: e.id, label: e.name, sub: e.category }))}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            const eq = equations.find((e) => e.id === id)
            if (eq) {
              const c = centerInScene()
              addCard({ id: newId(), type: 'equation', x: c.x, y: c.y, name: eq.name, latex: eq.latex })
            }
            setPicking(null)
          }}
        />
      )}
      {picking === 'pdf' && (
        <Picker
          label="Add a PDF"
          items={pdfAttachments.map((a) => ({ id: a.id, label: a.filename }))}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            const att = pdfAttachments.find((a) => a.id === id)
            if (att) {
              const c = centerInScene()
              addCard({ id: newId(), type: 'pdf', x: c.x, y: c.y, attachmentId: att.id, filename: att.filename })
            }
            setPicking(null)
          }}
        />
      )}
    </div>
  )
}
