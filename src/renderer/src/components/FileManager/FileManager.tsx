import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Attachment } from '@shared/types'
import { useStore } from '../../store/store'
import { iconForMime, formatFileSize } from '../../lib/fileIcons'
import { openAttachment } from '../../lib/openAttachment'
import { ConfirmDialog, type ConfirmRequest } from '../ConfirmDialog/ConfirmDialog'
import styles from './FileManager.module.css'

const UNLINKED = '__unlinked__'

/** Parses a <select> value of the form "note:123" / "folder:45" / "__unlinked__". */
function parseMoveValue(value: string): { noteId: number | null; folderId: number | null } {
  if (value === UNLINKED) return { noteId: null, folderId: null }
  const [kind, id] = value.split(':')
  return {
    noteId: kind === 'note' ? Number(id) : null,
    folderId: kind === 'folder' ? Number(id) : null
  }
}

export function FileManager(): React.JSX.Element | null {
  const open = useStore((s) => s.fileManagerOpen)
  const setOpen = useStore((s) => s.setFileManagerOpen)
  const notes = useStore((s) => s.notes)
  const folders = useStore((s) => s.folders)
  const attachmentsVersion = useStore((s) => s.attachmentsVersion)
  const bumpAttachments = useStore((s) => s.bumpAttachments)
  const selectNote = useStore((s) => s.selectNote)

  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<Attachment[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = async (q: string): Promise<void> => {
    setFiles(await window.api.attachments.list(q.trim() ? { query: q } : {}))
  }

  useEffect(() => {
    if (open) load(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attachmentsVersion])

  const noteTitle = useMemo(() => {
    const m = new Map(notes.map((n) => [n.id, n.title || 'Untitled']))
    return (id: number): string => m.get(id) ?? `Note #${id}`
  }, [notes])
  const folderName = useMemo(() => {
    const m = new Map(folders.map((f) => [f.id, f.name]))
    return (id: number): string => m.get(id) ?? `Folder #${id}`
  }, [folders])

  const linkedLabel = (f: Attachment): string => {
    if (f.noteId != null) return `Note: ${noteTitle(f.noteId)}`
    if (f.folderId != null) return `Folder: ${folderName(f.folderId)}`
    return 'Unlinked'
  }

  if (!open) return null

  const addUnlinked = async (): Promise<void> => {
    const att = await window.api.attachments.pick()
    if (att) bumpAttachments()
  }

  const addFiles = async (fileList: FileList): Promise<void> => {
    for (const file of Array.from(fileList)) {
      const data = new Uint8Array(await file.arrayBuffer())
      await window.api.attachments.add(file.name, file.type || '', data)
    }
    bumpAttachments()
  }

  const rename = async (id: string, filename: string): Promise<void> => {
    setEditingId(null)
    if (!filename.trim()) return
    await window.api.attachments.rename(id, filename.trim())
    bumpAttachments()
  }

  const move = async (id: string, value: string): Promise<void> => {
    await window.api.attachments.move(id, parseMoveValue(value))
    bumpAttachments()
  }

  const remove = async (id: string): Promise<void> => {
    await window.api.attachments.delete(id)
    setConfirmId(null)
    bumpAttachments()
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.head}>
        <span className={styles.title}>Files</span>
        <button className={styles.close} onClick={() => setOpen(false)} title="Close">
          <X size={15} />
        </button>
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search files…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            load(e.target.value)
          }}
        />
        <button className={styles.add} onClick={addUnlinked} title="Attach a file">
          <Plus size={16} />
        </button>
      </div>

      <div
        className={dragOver ? `${styles.list} ${styles.dragOver}` : styles.list}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes('Files')) return
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return
          e.preventDefault()
          setDragOver(false)
          void addFiles(e.dataTransfer.files)
        }}
      >
        {files.map((f) => {
          const TypeIcon = iconForMime(f.mime)
          return (
          <div key={f.id} className={styles.item}>
            <span className={styles.icon}>
              <TypeIcon size={16} />
            </span>
            <div className={styles.itemMain}>
              {editingId === f.id ? (
                <input
                  className={styles.renameInput}
                  autoFocus
                  defaultValue={f.filename}
                  onBlur={(e) => rename(f.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                />
              ) : (
                <span
                  className={styles.name}
                  onClick={() => openAttachment(f)}
                  onDoubleClick={() => setEditingId(f.id)}
                  title="Click to open, double-click to rename"
                >
                  {f.filename}
                </span>
              )}
              <div className={styles.meta}>
                <span>{formatFileSize(f.size)}</span>
                <button
                  className={styles.linkedBtn}
                  title={f.noteId != null ? 'Open this note' : undefined}
                  onClick={() => f.noteId != null && selectNote(f.noteId)}
                >
                  {linkedLabel(f)}
                </button>
              </div>
            </div>
            <select
              className={styles.moveSelect}
              value={f.noteId != null ? `note:${f.noteId}` : f.folderId != null ? `folder:${f.folderId}` : UNLINKED}
              onChange={(e) => move(f.id, e.target.value)}
              title="Move to…"
            >
              <option value={UNLINKED}>Unlinked</option>
              <optgroup label="Notes">
                {notes.map((n) => (
                  <option key={`note:${n.id}`} value={`note:${n.id}`}>
                    {n.title || 'Untitled'}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Folders">
                {folders.map((fo) => (
                  <option key={`folder:${fo.id}`} value={`folder:${fo.id}`}>
                    {fo.name}
                  </option>
                ))}
              </optgroup>
            </select>
            <button className={styles.mini} title="Rename" onClick={() => setEditingId(f.id)}>
              <Pencil size={13} />
            </button>
            <button className={styles.mini} title="Delete" onClick={() => setConfirmId(f.id)}>
              <Trash2 size={13} />
            </button>
          </div>
          )
        })}
        {files.length === 0 && (
          <div className={styles.empty}>No files found. Drop one here or click + to attach.</div>
        )}
      </div>

      <ConfirmDialog
        request={
          confirmId
            ? ({
                title: 'Delete file?',
                message: 'This file will be permanently deleted, including any copies embedded in notes.'
              } as ConfirmRequest)
            : null
        }
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </aside>
  )
}
