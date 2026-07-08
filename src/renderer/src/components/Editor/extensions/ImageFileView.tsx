import { useEffect, useRef, useState } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import styles from './ImageFile.module.css'

const MIN_W = 80

export function ImageFileView({
  node,
  updateAttributes,
  selected,
  editor
}: NodeViewProps): React.JSX.Element {
  const id = node.attrs.attachmentId as string
  const filename = node.attrs.filename as string
  const mime = (node.attrs.mime as string) || ''
  const width = node.attrs.width as number
  const isImage = mime.startsWith('image/')
  const editable = editor.isEditable
  const src = `note24-attachment://media/${id}`

  const frameRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState<number | null>(width || null)
  useEffect(() => setW(width || null), [width])

  const onResizeStart = (e: React.PointerEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const startW = frameRef.current?.offsetWidth ?? 320
    const startX = e.clientX
    let lw = startW
    const move = (ev: PointerEvent): void => {
      lw = Math.max(MIN_W, startW + (ev.clientX - startX))
      setW(lw)
    }
    const up = (): void => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      updateAttributes({ width: Math.round(lw) })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  if (!isImage) {
    return (
      <NodeViewWrapper className={styles.wrap}>
        <div
          className={selected ? `${styles.chip} ${styles.sel}` : styles.chip}
          contentEditable={false}
          onClick={() => window.api.attachments.open(id)}
          title="Open file"
        >
          <span className={styles.icon}>📎</span>
          <span className={styles.name}>{filename || 'file'}</span>
        </div>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className={styles.wrap}>
      <div
        ref={frameRef}
        className={selected ? `${styles.imgFrame} ${styles.sel}` : styles.imgFrame}
        contentEditable={false}
        style={w ? { width: w } : undefined}
      >
        <img src={src} alt={filename} className={styles.img} draggable={false} />
        {editable && <div className={styles.resizeHandle} onPointerDown={onResizeStart} />}
      </div>
    </NodeViewWrapper>
  )
}
