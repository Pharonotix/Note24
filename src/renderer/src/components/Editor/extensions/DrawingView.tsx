import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import styles from './Drawing.module.css'

// Excalidraw is large — load it (and its CSS) only when a drawing is present.
const Excalidraw = lazy(() =>
  Promise.all([
    import('@excalidraw/excalidraw'),
    import('@excalidraw/excalidraw/index.css')
  ]).then(([m]) => ({ default: m.Excalidraw }))
)

const DEFAULT_W = 700
const DEFAULT_H = 430
const MIN_W = 300
const MIN_H = 240

export function DrawingView({
  node,
  updateAttributes,
  selected,
  editor
}: NodeViewProps): React.JSX.Element {
  const editable = editor.isEditable
  const attrW = (node.attrs.width as number) || DEFAULT_W
  const attrH = (node.attrs.height as number) || DEFAULT_H
  const [size, setSize] = useState({ w: attrW, h: attrH })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => setSize({ w: attrW, h: attrH }), [attrW, attrH])

  const initialData = useMemo(() => {
    try {
      const s = JSON.parse((node.attrs.scene as string) || '')
      return { elements: s.elements ?? [], files: s.files ?? {}, scrollToContent: true }
    } catch {
      return { elements: [], files: {} }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onChange = (elements: readonly unknown[], _appState: unknown, files: unknown): void => {
    if (!editable) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateAttributes({ scene: JSON.stringify({ elements, files }) })
    }, 800)
  }

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
      >
        <Suspense fallback={<div className={styles.loading}>Loading canvas…</div>}>
          <Excalidraw
            initialData={initialData}
            onChange={onChange}
            viewModeEnabled={!editable}
            UIOptions={{ canvasActions: { toggleTheme: false, saveToActiveFile: false, loadScene: false } }}
          />
        </Suspense>
        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
