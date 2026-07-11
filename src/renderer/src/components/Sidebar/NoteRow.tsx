import type { NoteSummary } from '@shared/types'
import styles from './Sidebar.module.css'

/** A single note row: draggable, a drop target for before/after reordering, and renamable in place. */
export function NoteRow({
  note,
  active,
  editing,
  indicator,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onRequestDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop
}: {
  note: NoteSummary
  active: boolean
  editing: boolean
  indicator: 'before' | 'after' | null
  onSelect: () => void
  onStartRename: () => void
  onRename: (title: string) => void
  onCancelRename: () => void
  onRequestDelete: () => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}): React.JSX.Element {
  return (
    <li
      className={active ? `${styles.noteRow} ${styles.active}` : styles.noteRow}
      onClick={onSelect}
      draggable={!editing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDragOver(e)
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDrop(e)
      }}
    >
      {indicator === 'before' && <span className={styles.insertLine} data-pos="before" />}
      {editing ? (
        <input
          className={styles.noteRenameInput}
          autoFocus
          defaultValue={note.title}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onRename(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            if (e.key === 'Escape') onCancelRename()
          }}
        />
      ) : (
        <span
          className={styles.noteTitle}
          onDoubleClick={(e) => {
            e.stopPropagation()
            onStartRename()
          }}
          title="Double-click to rename"
        >
          {note.title || 'Untitled'}
        </span>
      )}
      <button
        className={styles.iconBtn}
        title="Delete note"
        onClick={(e) => {
          e.stopPropagation()
          onRequestDelete()
        }}
      >
        ✕
      </button>
      {indicator === 'after' && <span className={styles.insertLine} data-pos="after" />}
    </li>
  )
}
