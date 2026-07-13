import { getDb } from './database'

interface PmNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: PmNode[]
}

/** Collects attachment ids referenced by `imageFile` nodes in a ProseMirror doc. */
function extractAttachmentIds(contentJson: string): string[] {
  const ids: string[] = []
  try {
    const doc = JSON.parse(contentJson) as PmNode
    const walk = (n?: PmNode): void => {
      if (!n) return
      if (n.type === 'imageFile' && n.attrs && typeof n.attrs.attachmentId === 'string') {
        const id = n.attrs.attachmentId.trim()
        if (id) ids.push(id)
      }
      n.content?.forEach(walk)
    }
    walk(doc)
  } catch {
    /* ignore malformed content */
  }
  return ids
}

/**
 * One-time (but idempotent) backfill: links pre-existing embedded-image attachments
 * to the note they're embedded in, so they show up in that note's attachments list
 * even though they were uploaded before note/folder linkage existed. Only touches
 * attachment rows that are currently fully unlinked — never overwrites a deliberate
 * later move to a note or folder.
 */
export function backfillAttachmentNoteLinks(): void {
  const db = getDb()
  const notes = db.prepare(`SELECT id, content FROM notes`).all() as { id: number; content: string }[]
  const update = db.prepare(
    `UPDATE attachments SET note_id = ? WHERE id = ? AND note_id IS NULL AND folder_id IS NULL`
  )
  const tx = db.transaction(() => {
    for (const note of notes) {
      for (const attachmentId of extractAttachmentIds(note.content)) {
        update.run(note.id, attachmentId)
      }
    }
  })
  tx()
}
