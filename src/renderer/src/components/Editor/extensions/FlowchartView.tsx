import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useStore } from '../../../store/store'
import { isDarkPreset } from '../../../lib/theme'
import { startResizeDrag } from '../../../lib/resizeDrag'
import { FlowchartCanvas, type FlowEdge, type FlowNode } from '../../FlowchartCanvas'
import styles from './Flowchart.module.css'

const DEFAULT_W = 700
const DEFAULT_H = 420
const MIN_W = 360
const MIN_H = 260

function parseData(json: string): { nodes: FlowNode[]; edges: FlowEdge[] } {
  try {
    const parsed = JSON.parse(json || '')
    return { nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] }
  } catch {
    return { nodes: [], edges: [] }
  }
}

export function FlowchartView({
  node,
  updateAttributes,
  selected,
  editor
}: NodeViewProps): React.JSX.Element {
  const editable = editor.isEditable
  const dark = useStore((s) => isDarkPreset(s.theme.preset))
  const attrW = (node.attrs.width as number) || DEFAULT_W
  const attrH = (node.attrs.height as number) || DEFAULT_H
  const [size, setSize] = useState({ w: attrW, h: attrH })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<{ nodes: FlowNode[]; edges: FlowEdge[] } | null>(null)

  const initial = useMemo(
    () => parseData(node.attrs.data as string),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const onChange = (nodes: FlowNode[], edges: FlowEdge[]): void => {
    if (!editable) return
    pending.current = { nodes, edges }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      pending.current = null
      updateAttributes({ data: JSON.stringify({ nodes, edges }) })
    }, 800)
  }

  // Flush a pending debounced save immediately on unmount (e.g. switching notes),
  // same reasoning as Editor.tsx's body/title flush — otherwise an edit made just
  // before switching away can be silently dropped.
  useEffect(() => {
    return () => {
      if (saveTimer.current && pending.current) {
        clearTimeout(saveTimer.current)
        updateAttributes({ data: JSON.stringify(pending.current) })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onResizeStart = (e: React.PointerEvent): void =>
    startResizeDrag(e, {
      startW: size.w,
      startH: size.h,
      minW: MIN_W,
      minH: MIN_H,
      onLive: (w, h) => setSize({ w, h }),
      onCommit: (width, height) => updateAttributes({ width, height })
    })

  return (
    <NodeViewWrapper className={styles.wrap}>
      <div
        className={selected ? `${styles.frame} ${styles.sel}` : styles.frame}
        style={{ width: size.w, height: size.h }}
        contentEditable={false}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <Suspense fallback={<div className={styles.loading}>Loading diagram…</div>}>
          <FlowchartCanvas
            initialNodes={initial.nodes}
            initialEdges={initial.edges}
            onChange={onChange}
            editable={editable}
            dark={dark}
          />
        </Suspense>
        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
