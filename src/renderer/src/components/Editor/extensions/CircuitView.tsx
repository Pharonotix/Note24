import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Download, FileImage, FileType } from 'lucide-react'
import { useStore } from '../../../store/store'
import { isDarkPreset } from '../../../lib/theme'
import { startResizeDrag } from '../../../lib/resizeDrag'
import { CircuitCanvas, type CircuitFlowEdge, type CircuitFlowNode } from '../../CircuitCanvas'
import styles from './Circuit.module.css'

const DEFAULT_W = 720
const DEFAULT_H = 440
const MIN_W = 400
const MIN_H = 280

function parseData(json: string): { nodes: CircuitFlowNode[]; edges: CircuitFlowEdge[] } {
  try {
    const parsed = JSON.parse(json || '')
    return { nodes: parsed.nodes ?? [], edges: parsed.edges ?? [] }
  } catch {
    return { nodes: [], edges: [] }
  }
}

export function CircuitView({ node, updateAttributes, selected, editor }: NodeViewProps): React.JSX.Element {
  const editable = editor.isEditable
  const dark = useStore((s) => isDarkPreset(s.theme.preset))
  const attrW = (node.attrs.width as number) || DEFAULT_W
  const attrH = (node.attrs.height as number) || DEFAULT_H
  const [size, setSize] = useState({ w: attrW, h: attrH })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<{ nodes: CircuitFlowNode[]; edges: CircuitFlowEdge[] } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  const initial = useMemo(
    () => parseData(node.attrs.data as string),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const onChange = (nodes: CircuitFlowNode[], edges: CircuitFlowEdge[]): void => {
    if (!editable) return
    pending.current = { nodes, edges }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      pending.current = null
      updateAttributes({ data: JSON.stringify({ nodes, edges }) })
    }, 800)
  }

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

  const exportAs = async (kind: 'png' | 'svg' | 'pdf'): Promise<void> => {
    const target = frameRef.current?.querySelector('.react-flow') as HTMLElement | null
    if (!target || exporting) return
    setExporting(true)
    try {
      const htmlToImage = await import('html-to-image')
      const pngDataUrl = await htmlToImage.toPng(target, { pixelRatio: 2 })
      if (kind === 'png') {
        await window.api.export.saveDataUrl(pngDataUrl, 'circuit', 'png')
      } else if (kind === 'svg') {
        const svgDataUrl = await htmlToImage.toSvg(target)
        await window.api.export.saveDataUrl(svgDataUrl, 'circuit', 'svg')
      } else {
        const { jsPDF } = await import('jspdf')
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to load rendered image'))
          img.src = pngDataUrl
        })
        const orientation = img.width >= img.height ? 'landscape' : 'portrait'
        const doc = new jsPDF({ orientation, unit: 'pt', format: [img.width, img.height] })
        doc.addImage(pngDataUrl, 'PNG', 0, 0, img.width, img.height)
        await window.api.export.saveDataUrl(doc.output('datauristring'), 'circuit', 'pdf')
      }
    } catch (e) {
      console.error('Circuit export failed', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <NodeViewWrapper className={styles.wrap}>
      <div
        ref={frameRef}
        className={selected ? `${styles.frame} ${styles.sel}` : styles.frame}
        style={{ width: size.w, height: size.h }}
        contentEditable={false}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <Suspense fallback={<div className={styles.loading}>Loading circuit…</div>}>
          <CircuitCanvas
            initialNodes={initial.nodes}
            initialEdges={initial.edges}
            onChange={onChange}
            editable={editable}
            dark={dark}
          />
        </Suspense>
        {editable && (
          <div className={styles.exportBar}>
            <button className={styles.exportBtn} title="Export PNG" disabled={exporting} onClick={() => exportAs('png')}>
              <FileImage size={13} />
            </button>
            <button className={styles.exportBtn} title="Export SVG" disabled={exporting} onClick={() => exportAs('svg')}>
              <Download size={13} />
            </button>
            <button className={styles.exportBtn} title="Export PDF" disabled={exporting} onClick={() => exportAs('pdf')}>
              <FileType size={13} />
            </button>
          </div>
        )}
        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
