import { useEffect, useState } from 'react'
import type { Backlink } from '@shared/types'
import { useStore } from '../../store/store'
import styles from './Backlinks.module.css'

/** Shows notes that link to the current note (resolved by title). */
export function Backlinks({ noteId }: { noteId: number }): React.JSX.Element | null {
  const notes = useStore((s) => s.notes)
  const selectNote = useStore((s) => s.selectNote)
  const [links, setLinks] = useState<Backlink[]>([])

  useEffect(() => {
    let active = true
    window.api.notes.backlinks(noteId).then((b) => {
      if (active) setLinks(b)
    })
    return () => {
      active = false
    }
    // refetch when the note switches or notes change (e.g. after an edit)
  }, [noteId, notes])

  if (links.length === 0) return null

  return (
    <div className={styles.box}>
      <div className={styles.head}>Linked mentions · {links.length}</div>
      <div className={styles.items}>
        {links.map((l) => (
          <button key={l.noteId} className={styles.item} onClick={() => selectNote(l.noteId)}>
            <span className={styles.arrow}>↩</span>
            {l.title || 'Untitled'}
          </button>
        ))}
      </div>
    </div>
  )
}
