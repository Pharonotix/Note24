import { useMemo, useState } from 'react'
import type { NoteSummary } from '@shared/types'
import { useStore } from '../../store/store'
import styles from './Sidebar.module.css'

export function Sidebar(): React.JSX.Element {
  const notes = useStore((s) => s.notes)
  const folders = useStore((s) => s.folders)
  const tags = useStore((s) => s.tags)
  const query = useStore((s) => s.query)
  const activeTag = useStore((s) => s.activeTag)
  const currentNoteId = useStore((s) => s.currentNoteId)
  const setQuery = useStore((s) => s.setQuery)
  const setActiveTag = useStore((s) => s.setActiveTag)
  const selectNote = useStore((s) => s.selectNote)
  const newNote = useStore((s) => s.newNote)
  const removeNote = useStore((s) => s.removeNote)
  const moveNote = useStore((s) => s.moveNote)
  const newFolder = useStore((s) => s.newFolder)
  const renameFolder = useStore((s) => s.renameFolder)
  const removeFolder = useStore((s) => s.removeFolder)

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [editingFolder, setEditingFolder] = useState<number | null>(null)
  const [dragNote, setDragNote] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | 'root' | null>(null)

  const visibleNotes = useMemo(
    () => (activeTag ? notes.filter((n) => n.tags.includes(activeTag)) : notes),
    [notes, activeTag]
  )

  const byFolder = useMemo(() => {
    const map = new Map<number | null, NoteSummary[]>()
    map.set(null, [])
    folders.forEach((f) => map.set(f.id, []))
    visibleNotes.forEach((n) => {
      const key = n.folderId != null && map.has(n.folderId) ? n.folderId : null
      map.get(key)!.push(n)
    })
    return map
  }, [visibleNotes, folders])

  const toggle = (id: number): void =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const onDropTo = (folderId: number | null): void => {
    if (dragNote != null) moveNote(dragNote, folderId)
    setDragNote(null)
    setDropTarget(null)
  }

  const NoteRow = ({ n }: { n: NoteSummary }): React.JSX.Element => (
    <li
      className={n.id === currentNoteId ? `${styles.noteRow} ${styles.active}` : styles.noteRow}
      onClick={() => selectNote(n.id)}
      draggable
      onDragStart={() => setDragNote(n.id)}
      onDragEnd={() => {
        setDragNote(null)
        setDropTarget(null)
      }}
    >
      <span className={styles.noteTitle}>{n.title || 'Untitled'}</span>
      <button
        className={styles.iconBtn}
        title="Delete note"
        onClick={(e) => {
          e.stopPropagation()
          removeNote(n.id)
        }}
      >
        ✕
      </button>
    </li>
  )

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        Note24
      </div>

      <div className={styles.toolRow}>
        <button className={styles.primary} onClick={() => newNote(null)}>
          + New note
        </button>
        <button className={styles.ghost} title="New folder" onClick={() => newFolder('New Folder')}>
          🗀+
        </button>
      </div>

      <input
        className={styles.search}
        placeholder="Search notes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {tags.length > 0 && (
        <div className={styles.tagRow}>
          {tags.map((t) => (
            <button
              key={t.id}
              className={activeTag === t.name ? `${styles.tag} ${styles.tagActive}` : styles.tag}
              onClick={() => setActiveTag(activeTag === t.name ? null : t.name)}
            >
              #{t.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.list}>
        {/* Ungrouped notes (drop here to remove from a folder) */}
        <div
          className={dropTarget === 'root' ? `${styles.rootDrop} ${styles.dropOver}` : styles.rootDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setDropTarget('root')
          }}
          onDragLeave={() => setDropTarget((p) => (p === 'root' ? null : p))}
          onDrop={() => onDropTo(null)}
        >
          <ul>
            {byFolder.get(null)!.map((n) => (
              <NoteRow key={n.id} n={n} />
            ))}
          </ul>
        </div>

        {/* Folders */}
        {folders.map((f) => {
          const folderNotes = byFolder.get(f.id) ?? []
          const isCollapsed = collapsed.has(f.id)
          return (
            <div
              key={f.id}
              className={dropTarget === f.id ? `${styles.folder} ${styles.dropOver}` : styles.folder}
              onDragOver={(e) => {
                e.preventDefault()
                setDropTarget(f.id)
              }}
              onDragLeave={() => setDropTarget((p) => (p === f.id ? null : p))}
              onDrop={() => onDropTo(f.id)}
            >
              <div className={styles.folderHead}>
                <button className={styles.caret} onClick={() => toggle(f.id)}>
                  {isCollapsed ? '▸' : '▾'}
                </button>
                {editingFolder === f.id ? (
                  <input
                    className={styles.folderInput}
                    autoFocus
                    defaultValue={f.name}
                    onBlur={(e) => {
                      renameFolder(f.id, e.target.value)
                      setEditingFolder(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setEditingFolder(null)
                    }}
                  />
                ) : (
                  <span
                    className={styles.folderName}
                    onDoubleClick={() => setEditingFolder(f.id)}
                    title="Double-click to rename"
                  >
                    {f.name}
                  </span>
                )}
                <span className={styles.count}>{folderNotes.length}</span>
                <button
                  className={styles.iconBtn}
                  title="New note in folder"
                  onClick={() => newNote(f.id)}
                >
                  +
                </button>
                <button
                  className={styles.iconBtn}
                  title="Delete folder (notes are kept)"
                  onClick={() => removeFolder(f.id)}
                >
                  ✕
                </button>
              </div>
              {!isCollapsed && (
                <ul className={styles.folderNotes}>
                  {folderNotes.map((n) => (
                    <NoteRow key={n.id} n={n} />
                  ))}
                </ul>
              )}
            </div>
          )
        })}

        {visibleNotes.length === 0 && <div className={styles.empty}>No notes found.</div>}
      </div>
    </aside>
  )
}
