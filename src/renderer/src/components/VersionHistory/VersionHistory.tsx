import { useEffect, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import type { NoteVersion } from '@shared/types'
import { useStore } from '../../store/store'
import styles from './VersionHistory.module.css'

function extractSnippet(contentJson: string): string {
  try {
    const doc = JSON.parse(contentJson)
    const parts: string[] = []
    const walk = (node: { text?: string; content?: unknown[] }): void => {
      if (typeof node?.text === 'string') parts.push(node.text)
      ;(node?.content as { text?: string; content?: unknown[] }[] | undefined)?.forEach(walk)
    }
    walk(doc)
    const text = parts.join(' ').trim()
    return text.length > 140 ? `${text.slice(0, 140)}…` : text || '(empty)'
  } catch {
    return ''
  }
}

export function VersionHistory(): React.JSX.Element | null {
  const noteId = useStore((s) => s.versionHistoryNoteId)
  const setNoteId = useStore((s) => s.setVersionHistoryNoteId)
  const restoreNoteVersion = useStore((s) => s.restoreNoteVersion)

  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [confirmId, setConfirmId] = useState<number | null>(null)

  useEffect(() => {
    if (noteId != null) window.api.notes.versions(noteId).then(setVersions)
  }, [noteId])

  if (noteId == null) return null

  return (
    <div className={styles.overlay} onMouseDown={() => setNoteId(null)}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.title}>Version history</span>
          <button className={styles.close} onClick={() => setNoteId(null)} title="Close">
            <X size={15} />
          </button>
        </div>
        <div className={styles.list}>
          {versions.map((v) => (
            <div key={v.id} className={styles.row}>
              <div className={styles.rowMain}>
                <div className={styles.rowDate}>{new Date(v.createdAt).toLocaleString()}</div>
                <div className={styles.rowTitle}>{v.title || 'Untitled'}</div>
                <div className={styles.rowSnippet}>{extractSnippet(v.content)}</div>
              </div>
              {confirmId === v.id ? (
                <div className={styles.confirmRow}>
                  <button
                    className={styles.confirmBtn}
                    onClick={() => restoreNoteVersion(noteId, v.id)}
                  >
                    Restore this version
                  </button>
                  <button className={styles.cancelBtn} onClick={() => setConfirmId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className={styles.restoreBtn} onClick={() => setConfirmId(v.id)}>
                  <RotateCcw size={13} /> Restore
                </button>
              )}
            </div>
          ))}
          {versions.length === 0 && (
            <div className={styles.empty}>
              No past versions yet — a snapshot is taken each time you switch away from an
              edited note.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
