import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Note } from '@shared/types'
import { useStore } from '../../store/store'
import { contentExtensions } from '../Editor/contentExtensions'
import styles from './PrintLayer.module.css'

function parseContent(json: string): object {
  try {
    const doc = JSON.parse(json)
    if (doc && doc.type === 'doc') return doc
  } catch {
    /* fall through */
  }
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

function PrintNote({ note, pageBreakAfter }: { note: Note; pageBreakAfter: boolean }): React.JSX.Element {
  const editor = useEditor({
    extensions: contentExtensions(),
    content: parseContent(note.content),
    editable: false
  })
  return (
    <div className={pageBreakAfter ? `${styles.note} ${styles.pageBreak}` : styles.note}>
      <h1 className={styles.title}>{note.title || 'Untitled'}</h1>
      <EditorContent editor={editor} />
    </div>
  )
}

/**
 * Replaces the entire app UI with a plain, print-styled render of the selected
 * notes, waits for it to actually finish painting (images, KaTeX, canvases), then
 * asks the main process to capture the page (printToPDF or the OS print dialog).
 * Mounted instead of the normal app — see App.tsx — so the captured page never
 * includes app chrome (sidebar/toolbar/panels), only the printable content.
 */
export function PrintLayer(): React.JSX.Element | null {
  const printJob = useStore((s) => s.printJob)
  const setPrintJob = useStore((s) => s.setPrintJob)
  const [notes, setNotes] = useState<Note[] | null>(null)
  const [status, setStatus] = useState<'loading' | 'rendering' | 'capturing' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!printJob) {
      setNotes(null)
      return
    }
    setStatus('loading')
    Promise.all(printJob.noteIds.map((id) => window.api.notes.get(id))).then((res) => {
      setNotes(res.filter((n): n is Note => n != null))
      setStatus('rendering')
    })
  }, [printJob])

  const startedForRef = useRef<Note[] | null>(null)

  useEffect(() => {
    // Gate on `notes` identity (not `status`) — calling setStatus('capturing') below
    // must NOT re-trigger this effect, or the in-flight run gets cancelled by its
    // own cleanup before it can revert printJob, leaving the UI stuck on "Generating…"
    // even though the capture already succeeded.
    if (status !== 'rendering' || !notes || !printJob || startedForRef.current === notes) return
    startedForRef.current = notes
    let cancelled = false
    const run = async (): Promise<void> => {
      // Let React commit and the browser paint, then wait for embedded images
      // (note24-attachment:// <img> tags) to finish loading before capturing.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const imgs = containerRef.current ? [...containerRef.current.querySelectorAll('img')] : []
      await Promise.all(
        imgs.map(
          (img) =>
            img.complete ||
            new Promise((r) => {
              img.onload = r
              img.onerror = r
            })
        )
      )
      // A short settle window for canvas-based blocks (Desmos/Excalidraw/calculator).
      await new Promise((r) => setTimeout(r, 400))
      if (cancelled) return
      setStatus('capturing')
      try {
        if (printJob.mode === 'print') {
          await window.api.export.print()
        } else {
          const suggested = notes.length === 1 ? notes[0].title || 'Untitled' : 'Note24 export'
          await window.api.export.toPdf(suggested)
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : 'Export failed')
          setStatus('error')
        }
        return
      }
      if (!cancelled) setPrintJob(null)
    }
    void run()
    return () => {
      cancelled = true
    }
    // `status` is deliberately excluded — setStatus('capturing') inside run() must
    // not re-trigger this effect (see comment above); the `startedForRef` guard
    // above uses the current `status` value without needing it as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, printJob, setPrintJob])

  if (!printJob) return null

  if (status === 'error') {
    return (
      <div className={styles.errHost}>
        <div className={styles.errBox}>
          <div>⚠ {errorMsg}</div>
          <button className={styles.errClose} onClick={() => setPrintJob(null)}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.host}>
      <div ref={containerRef} className={styles.container}>
        {notes && notes.length > 1 && (
          <div className={`${styles.note} ${styles.pageBreak}`}>
            <h1 className={styles.title}>Contents</h1>
            <ul className={styles.toc}>
              {notes.map((n) => (
                <li key={n.id}>{n.title || 'Untitled'}</li>
              ))}
            </ul>
          </div>
        )}
        {notes?.map((n, i) => (
          <PrintNote key={n.id} note={n} pageBreakAfter={i < notes.length - 1} />
        ))}
      </div>
      <div className={styles.hud}>{status === 'capturing' ? 'Generating…' : 'Preparing…'}</div>
    </div>
  )
}
