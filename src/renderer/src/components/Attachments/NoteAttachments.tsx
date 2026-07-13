import { useEffect, useState } from 'react'
import type { Attachment } from '@shared/types'
import { useStore } from '../../store/store'
import { iconForMime, formatFileSize } from '../../lib/fileIcons'
import { ConfirmDialog, type ConfirmRequest } from '../ConfirmDialog/ConfirmDialog'
import styles from './Attachments.module.css'

/** Files attached to the current note (including ones embedded inline in the body). */
export function NoteAttachments({ noteId }: { noteId: number }): React.JSX.Element {
  const attachmentsVersion = useStore((s) => s.attachmentsVersion)
  const bumpAttachments = useStore((s) => s.bumpAttachments)
  const attachFilesToNote = useStore((s) => s.attachFilesToNote)

  const [files, setFiles] = useState<Attachment[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const load = async (): Promise<void> => {
    setFiles(await window.api.attachments.list({ noteId }))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, attachmentsVersion])

  const attach = async (): Promise<void> => {
    const att = await window.api.attachments.pick({ noteId })
    if (att) bumpAttachments()
  }

  const rename = async (id: string, filename: string): Promise<void> => {
    setEditingId(null)
    if (!filename.trim()) return
    await window.api.attachments.rename(id, filename.trim())
    bumpAttachments()
  }

  const remove = async (id: string): Promise<void> => {
    await window.api.attachments.delete(id)
    setConfirmId(null)
    bumpAttachments()
  }

  return (
    <div
      className={dragOver ? `${styles.box} ${styles.dragOver}` : styles.box}
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
        void attachFilesToNote(noteId, e.dataTransfer.files)
      }}
    >
      <div className={styles.head}>
        <span>Attachments{files.length > 0 ? ` · ${files.length}` : ''}</span>
        <button className={styles.attachBtn} onClick={attach} title="Attach a file">
          + Attach
        </button>
      </div>

      {files.length === 0 ? (
        <div className={styles.empty}>Drop a file here or click "Attach".</div>
      ) : (
        <div className={styles.items}>
          {files.map((f) => (
            <div key={f.id} className={styles.item}>
              <span className={styles.icon}>{iconForMime(f.mime)}</span>
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
                  onClick={() => window.api.attachments.open(f.id)}
                  onDoubleClick={() => setEditingId(f.id)}
                  title="Click to open, double-click to rename"
                >
                  {f.filename}
                </span>
              )}
              <span className={styles.size}>{formatFileSize(f.size)}</span>
              <button className={styles.mini} title="Rename" onClick={() => setEditingId(f.id)}>
                ✎
              </button>
              <button className={styles.mini} title="Delete" onClick={() => setConfirmId(f.id)}>
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        request={
          confirmId
            ? ({
                title: 'Delete attachment?',
                message:
                  'This file will be permanently deleted, including any copies embedded in this note.'
              } as ConfirmRequest)
            : null
        }
        onCancel={() => setConfirmId(null)}
        onConfirm={() => confirmId && remove(confirmId)}
      />
    </div>
  )
}
