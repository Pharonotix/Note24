import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useStore } from '../../../store/store'
import { isDarkPreset } from '../../../lib/theme'
import { startResizeDrag } from '../../../lib/resizeDrag'
import { ExcalidrawCanvas } from '../../ExcalidrawCanvas'
import styles from './Drawing.module.css'

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
  const dark = useStore((s) => isDarkPreset(s.theme.preset))
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
        <Suspense fallback={<div className={styles.loading}>Loading canvas…</div>}>
          <ExcalidrawCanvas
            initialData={initialData}
            onChange={onChange}
            viewModeEnabled={!editable}
            theme={dark ? 'dark' : 'light'}
            UIOptions={{ canvasActions: { toggleTheme: false, saveToActiveFile: false, loadScene: false } }}
          />
        </Suspense>
        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
