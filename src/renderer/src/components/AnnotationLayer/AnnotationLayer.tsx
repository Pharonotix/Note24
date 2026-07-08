import { Suspense, lazy, useMemo, useRef } from 'react'
import type { Note } from '@shared/types'
import { useStore } from '../../store/store'
import styles from './AnnotationLayer.module.css'

const Excalidraw = lazy(() =>
  Promise.all([
    import('@excalidraw/excalidraw'),
    import('@excalidraw/excalidraw/index.css')
  ]).then(([m]) => ({ default: m.Excalidraw }))
)

/**
 * Note-wide freehand overlay. When annotation mode is on it captures pointer
 * input for drawing/highlighting over the whole note; when off, existing
 * strokes stay visible but let clicks pass through to the note.
 */
export function AnnotationLayer({ note }: { note: Note }): React.JSX.Element | null {
  const active = useStore((s) => s.annotationMode)
  const setActive = useStore((s) => s.setAnnotationMode)
  const updateAnnotations = useStore((s) => s.updateAnnotations)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasScene = !!note.annotations

  const initialData = useMemo(() => {
    try {
      const s = JSON.parse(note.annotations || '')
      return {
        elements: s.elements ?? [],
        files: s.files ?? {},
        appState: { viewBackgroundColor: 'transparent' }
      }
    } catch {
      return { elements: [], files: {}, appState: { viewBackgroundColor: 'transparent' } }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  if (!active && !hasScene) return null

  const onChange = (elements: readonly unknown[], _appState: unknown, files: unknown): void => {
    if (!active) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateAnnotations(note.id, JSON.stringify({ elements, files }))
    }, 800)
  }

  return (
    <div className={active ? styles.layerActive : styles.layerView}>
      {active && (
        <button className={styles.done} onClick={() => setActive(false)}>
          Done annotating
        </button>
      )}
      <Suspense fallback={null}>
        <Excalidraw
          initialData={initialData}
          viewModeEnabled={!active}
          onChange={onChange}
          UIOptions={{ canvasActions: { toggleTheme: false, saveToActiveFile: false, loadScene: false, export: false } }}
        />
      </Suspense>
    </div>
  )
}
