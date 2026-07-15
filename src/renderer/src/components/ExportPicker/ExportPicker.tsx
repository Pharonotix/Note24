import { useEffect, useMemo, useState } from 'react'
import type { Folder, NoteSummary } from '@shared/types'
import { useStore } from '../../store/store'
import styles from './ExportPicker.module.css'

type CheckState = 'checked' | 'unchecked' | 'indeterminate'

export function ExportPicker(): React.JSX.Element | null {
  const open = useStore((s) => s.exportPickerOpen)
  const setOpen = useStore((s) => s.setExportPickerOpen)
  const notes = useStore((s) => s.notes)
  const folders = useStore((s) => s.folders)
  const currentNoteId = useStore((s) => s.currentNoteId)
  const setPrintJob = useStore((s) => s.setPrintJob)

  const [checked, setChecked] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) setChecked(currentNoteId != null ? new Set([currentNoteId]) : new Set())
  }, [open, currentNoteId])

  const notesByFolder = useMemo(() => {
    const map = new Map<number | null, NoteSummary[]>()
    map.set(null, [])
    folders.forEach((f) => map.set(f.id, []))
    notes.forEach((n) => {
      const key = n.folderId != null && map.has(n.folderId) ? n.folderId : null
      map.get(key)!.push(n)
    })
    return map
  }, [notes, folders])

  const foldersByParent = useMemo(() => {
    const map = new Map<number | null, Folder[]>()
    map.set(null, [])
    folders.forEach((f) => map.set(f.id, []))
    folders.forEach((f) => map.get(f.parentId != null && map.has(f.parentId) ? f.parentId : null)!.push(f))
    return map
  }, [folders])

  const folderNoteIds = (folderId: number): number[] => {
    const direct = (notesByFolder.get(folderId) ?? []).map((n) => n.id)
    const childFolders = foldersByParent.get(folderId) ?? []
    return [...direct, ...childFolders.flatMap((f) => folderNoteIds(f.id))]
  }

  const folderState = (folderId: number): CheckState => {
    const ids = folderNoteIds(folderId)
    if (ids.length === 0) return 'unchecked'
    const n = ids.filter((id) => checked.has(id)).length
    if (n === 0) return 'unchecked'
    if (n === ids.length) return 'checked'
    return 'indeterminate'
  }

  const toggleNote = (id: number): void =>
    setChecked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleFolder = (folderId: number): void => {
    const ids = folderNoteIds(folderId)
    const allChecked = ids.length > 0 && ids.every((id) => checked.has(id))
    setChecked((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => (allChecked ? next.delete(id) : next.add(id)))
      return next
    })
  }

  if (!open) return null

  const startExport = (): void => {
    if (checked.size === 0) return
    setOpen(false)
    setPrintJob({ noteIds: [...checked], mode: 'export' })
  }

  const renderNote = (n: NoteSummary, depth: number): React.JSX.Element => (
    <label key={`n${n.id}`} className={styles.row} style={{ marginLeft: depth * 16 }}>
      <input type="checkbox" checked={checked.has(n.id)} onChange={() => toggleNote(n.id)} />
      <span className={styles.noteIcon}>📝</span>
      {n.title || 'Untitled'}
    </label>
  )

  const renderFolder = (f: Folder, depth: number): React.JSX.Element => {
    const state = folderState(f.id)
    return (
      <div key={`f${f.id}`}>
        <label className={styles.row} style={{ marginLeft: depth * 16 }}>
          <input
            type="checkbox"
            checked={state === 'checked'}
            ref={(el) => {
              if (el) el.indeterminate = state === 'indeterminate'
            }}
            onChange={() => toggleFolder(f.id)}
          />
          <span className={styles.folderIcon}>🗀</span>
          <span className={styles.folderName}>{f.name}</span>
        </label>
        {(foldersByParent.get(f.id) ?? []).map((c) => renderFolder(c, depth + 1))}
        {(notesByFolder.get(f.id) ?? []).map((n) => renderNote(n, depth + 1))}
      </div>
    )
  }

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.title}>Export to PDF</span>
          <button className={styles.close} onClick={() => setOpen(false)} title="Close">
            ✕
          </button>
        </div>
        <div className={styles.hint}>
          Check individual notes, or a folder to include everything inside it. Selected notes
          are combined into a single PDF, in sidebar order.
        </div>
        <div className={styles.body}>
          {(notesByFolder.get(null) ?? []).map((n) => renderNote(n, 0))}
          {(foldersByParent.get(null) ?? []).map((f) => renderFolder(f, 0))}
          {notes.length === 0 && folders.length === 0 && <div className={styles.empty}>No notes yet.</div>}
        </div>
        <div className={styles.footer}>
          <span className={styles.count}>{checked.size} selected</span>
          <button className={styles.exportBtn} disabled={checked.size === 0} onClick={startExport}>
            Export {checked.size || ''} to PDF
          </button>
        </div>
      </div>
    </div>
  )
}
