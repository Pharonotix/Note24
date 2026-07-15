import { useMemo, useState } from 'react'
import { FolderPlus } from 'lucide-react'
import type { Folder, NoteSummary } from '@shared/types'
import { useStore } from '../../store/store'
import { positionFromEvent, type DropTarget } from './dragTypes'
import { isSelfOrDescendant, type TreeCtx } from './treeCtx'
import { FolderNode } from './FolderNode'
import { NoteRow } from './NoteRow'
import { ConfirmDialog, type ConfirmRequest } from '../ConfirmDialog/ConfirmDialog'
import styles from './Sidebar.module.css'

export function Sidebar(): React.JSX.Element {
  const notes = useStore((s) => s.notes)
  const folders = useStore((s) => s.folders)
  const tags = useStore((s) => s.tags)
  const query = useStore((s) => s.query)
  const activeTag = useStore((s) => s.activeTag)
  const currentNoteId = useStore((s) => s.currentNoteId)
  const dragItem = useStore((s) => s.dragItem)
  const setQuery = useStore((s) => s.setQuery)
  const setActiveTag = useStore((s) => s.setActiveTag)
  const selectNote = useStore((s) => s.selectNote)
  const newNote = useStore((s) => s.newNote)
  const removeNote = useStore((s) => s.removeNote)
  const renameNote = useStore((s) => s.renameNote)
  const moveNote = useStore((s) => s.moveNote)
  const reorderNotes = useStore((s) => s.reorderNotes)
  const newFolder = useStore((s) => s.newFolder)
  const renameFolder = useStore((s) => s.renameFolder)
  const removeFolder = useStore((s) => s.removeFolder)
  const moveFolder = useStore((s) => s.moveFolder)
  const reorderFolders = useStore((s) => s.reorderFolders)
  const updateFolderStyle = useStore((s) => s.updateFolderStyle)
  const setDragItem = useStore((s) => s.setDragItem)
  const attachFilesToNote = useStore((s) => s.attachFilesToNote)
  const attachFilesToFolder = useStore((s) => s.attachFilesToFolder)

  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [openPickerId, setOpenPickerId] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<
    { kind: 'note' | 'folder'; id: number; request: ConfirmRequest } | null
  >(null)

  const visibleNotes = useMemo(
    () => (activeTag ? notes.filter((n) => n.tags.includes(activeTag)) : notes),
    [notes, activeTag]
  )

  const notesByFolder = useMemo(() => {
    const map = new Map<number | null, NoteSummary[]>()
    map.set(null, [])
    folders.forEach((f) => map.set(f.id, []))
    visibleNotes.forEach((n) => {
      const key = n.folderId != null && map.has(n.folderId) ? n.folderId : null
      map.get(key)!.push(n)
    })
    return map
  }, [visibleNotes, folders])

  const foldersByParent = useMemo(() => {
    const map = new Map<number | null, Folder[]>()
    map.set(null, [])
    folders.forEach((f) => map.set(f.id, []))
    folders.forEach((f) => map.get(f.parentId != null && map.has(f.parentId) ? f.parentId : null)!.push(f))
    return map
  }, [folders])

  const toggle = (id: number): void =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const resolveDrop = (target: DropTarget): void => {
    const dragged = dragItem
    setDropTarget(null)
    if (!dragged) return

    if (target.kind === 'root') {
      if (dragged.kind === 'folder') void moveFolder(dragged.id, null)
      else void moveNote(dragged.id, null)
      return
    }

    if (target.kind === 'folder') {
      const targetFolder = folders.find((f) => f.id === target.id)
      if (!targetFolder) return

      if (dragged.kind === 'note') {
        void moveNote(dragged.id, target.id as number)
        return
      }

      // dragged.kind === 'folder'
      if (dragged.id === target.id) return
      if (isSelfOrDescendant(folders, dragged.id, target.id as number)) return // avoid cycles

      if (target.position === 'into') {
        void moveFolder(dragged.id, target.id as number)
        return
      }
      // before/after: reorder among the target's own siblings
      const parentId = targetFolder.parentId
      const siblings = (foldersByParent.get(parentId) ?? []).filter((f) => f.id !== dragged.id)
      const idx = siblings.findIndex((f) => f.id === target.id)
      const insertAt = target.position === 'before' ? idx : idx + 1
      const orderedIds = siblings.map((f) => f.id)
      orderedIds.splice(insertAt, 0, dragged.id)
      void reorderFolders(parentId, orderedIds)
      return
    }

    if (target.kind === 'note') {
      if (dragged.kind === 'folder') return // no meaningful position between notes for a folder
      const targetNote = notes.find((n) => n.id === target.id)
      if (!targetNote) return
      const folderId = targetNote.folderId
      const siblings = (notesByFolder.get(folderId) ?? []).filter((n) => n.id !== dragged.id)
      const idx = siblings.findIndex((n) => n.id === target.id)
      const insertAt = target.position === 'before' ? idx : idx + 1
      const orderedIds = siblings.map((n) => n.id)
      orderedIds.splice(insertAt, 0, dragged.id)
      void reorderNotes(folderId, orderedIds)
    }
  }

  const countDescendantFolders = (id: number): number => {
    let count = 0
    const stack = [...(foldersByParent.get(id) ?? [])]
    while (stack.length) {
      const f = stack.pop()!
      count++
      stack.push(...(foldersByParent.get(f.id) ?? []))
    }
    return count
  }

  const requestDeleteNote = (id: number, title: string): void => {
    setConfirmTarget({
      kind: 'note',
      id,
      request: {
        title: 'Delete note?',
        message: `“${title || 'Untitled'}” will be permanently deleted.`
      }
    })
  }

  const requestDeleteFolder = (id: number, name: string): void => {
    const subfolderCount = countDescendantFolders(id)
    const sub = subfolderCount > 0 ? ` and ${subfolderCount} subfolder${subfolderCount === 1 ? '' : 's'}` : ''
    setConfirmTarget({
      kind: 'folder',
      id,
      request: {
        title: 'Delete folder?',
        message: `“${name}”${sub} will be deleted. Notes inside are kept — they'll move to Unfiled, not be deleted.`
      }
    })
  }

  const ctx: TreeCtx = {
    childFoldersOf: (parentId) => foldersByParent.get(parentId) ?? [],
    notesOf: (folderId) => notesByFolder.get(folderId) ?? [],
    collapsed,
    toggle,
    currentNoteId,
    selectNote,
    requestDeleteNote,
    newNote,
    newSubfolder: (parentId) => newFolder('New Folder', parentId),
    editingFolderId,
    setEditingFolderId,
    editingNoteId,
    setEditingNoteId,
    renameNote,
    renameFolder,
    requestDeleteFolder,
    openPickerId,
    setOpenPickerId,
    updateFolderStyle,
    dropTarget,
    setDropTarget,
    resolveDrop,
    startDragFolder: (id) => setDragItem({ kind: 'folder', id }),
    startDragNote: (id) => setDragItem({ kind: 'note', id }),
    endDrag: () => {
      setDragItem(null)
      setDropTarget(null)
    },
    attachFiles: (target, files) => {
      if (target.kind === 'note') void attachFilesToNote(target.id, files)
      else void attachFilesToFolder(target.id, files)
    }
  }

  const rootFolders = foldersByParent.get(null) ?? []
  const rootNotes = notesByFolder.get(null) ?? []
  const rootIsDropTarget = dropTarget?.kind === 'root'

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
          <FolderPlus size={16} />
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

      <div
        className={rootIsDropTarget ? `${styles.list} ${styles.dropOver}` : styles.list}
        onDragOver={(e) => {
          e.preventDefault()
          setDropTarget({ kind: 'root', id: 'root', position: 'into' })
        }}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDropTarget(null)
        }}
        onDrop={(e) => {
          e.preventDefault()
          resolveDrop({ kind: 'root', id: 'root', position: 'into' })
        }}
      >
        {rootFolders.map((f) => (
          <FolderNode key={f.id} folder={f} depth={0} ctx={ctx} />
        ))}

        <ul>
          {rootNotes.map((n) => {
            const indicator =
              dropTarget?.kind === 'note' && dropTarget.id === n.id
                ? (dropTarget.position as 'before' | 'after')
                : null
            return (
              <NoteRow
                key={n.id}
                note={n}
                active={n.id === currentNoteId}
                editing={editingNoteId === n.id}
                indicator={indicator}
                onSelect={() => selectNote(n.id)}
                onStartRename={() => setEditingNoteId(n.id)}
                onRename={(title) => {
                  renameNote(n.id, title)
                  setEditingNoteId(null)
                }}
                onCancelRename={() => setEditingNoteId(null)}
                onRequestDelete={() => requestDeleteNote(n.id, n.title)}
                onDragStart={() => setDragItem({ kind: 'note', id: n.id })}
                onDragEnd={() => {
                  setDragItem(null)
                  setDropTarget(null)
                }}
                onDragOver={(e) => {
                  const position = positionFromEvent(e, false) as 'before' | 'after'
                  setDropTarget({ kind: 'note', id: n.id, position })
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={(e) => {
                  const position = positionFromEvent(e, false) as 'before' | 'after'
                  resolveDrop({ kind: 'note', id: n.id, position })
                }}
                onDropFiles={(files) => ctx.attachFiles({ kind: 'note', id: n.id }, files)}
              />
            )
          })}
        </ul>

        {visibleNotes.length === 0 && folders.length === 0 && (
          <div className={styles.empty}>No notes found.</div>
        )}
      </div>

      <ConfirmDialog
        request={confirmTarget?.request ?? null}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (!confirmTarget) return
          if (confirmTarget.kind === 'note') removeNote(confirmTarget.id)
          else removeFolder(confirmTarget.id)
          setConfirmTarget(null)
        }}
      />
    </aside>
  )
}
