import { X } from 'lucide-react'
import { useStore } from '../../store/store'
import styles from './TabBar.module.css'

/** Open-note tabs — a lightweight strip over the same single-active-note editor,
 *  letting the user quickly switch among a working set without the sidebar. */
export function TabBar(): React.JSX.Element | null {
  const openTabs = useStore((s) => s.openTabs)
  const notes = useStore((s) => s.notes)
  const currentNoteId = useStore((s) => s.currentNoteId)
  const selectNote = useStore((s) => s.selectNote)
  const closeTab = useStore((s) => s.closeTab)

  if (openTabs.length < 2) return null

  const tabs = openTabs.map((id) => notes.find((n) => n.id === id)).filter((n): n is NonNullable<typeof n> => !!n)

  return (
    <div className={styles.bar}>
      {tabs.map((n) => (
        <div
          key={n.id}
          className={n.id === currentNoteId ? `${styles.tab} ${styles.active}` : styles.tab}
          onClick={() => selectNote(n.id)}
        >
          <span className={styles.tabTitle}>{n.title || 'Untitled'}</span>
          <button
            className={styles.tabClose}
            onClick={(e) => {
              e.stopPropagation()
              closeTab(n.id)
            }}
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  )
}
