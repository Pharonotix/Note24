import type { NoteVersion } from '@shared/types'
import { getDb } from './database'

const MAX_VERSIONS_PER_NOTE = 50

interface VersionRow {
  id: number
  note_id: number
  title: string
  content: string
  created_at: number
}

function rowToVersion(r: VersionRow): NoteVersion {
  return { id: r.id, noteId: r.note_id, title: r.title, content: r.content, createdAt: r.created_at }
}

export function listVersions(noteId: number): NoteVersion[] {
  const rows = getDb()
    .prepare(`SELECT * FROM note_versions WHERE note_id = ? ORDER BY created_at DESC`)
    .all(noteId) as VersionRow[]
  return rows.map(rowToVersion)
}

export function getVersion(id: number): NoteVersion | null {
  const row = getDb().prepare(`SELECT * FROM note_versions WHERE id = ?`).get(id) as VersionRow | undefined
  return row ? rowToVersion(row) : null
}

/** Snapshots a note's current state, skipping if it's identical to the most recent
 *  version (switching away from a note you didn't edit shouldn't create noise), and
 *  prunes old versions past the per-note cap. */
export function createVersionIfChanged(noteId: number, title: string, content: string): void {
  const db = getDb()
  const last = db
    .prepare(`SELECT title, content FROM note_versions WHERE note_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(noteId) as { title: string; content: string } | undefined
  if (last && last.title === title && last.content === content) return

  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO note_versions (note_id, title, content, created_at) VALUES (?, ?, ?, ?)`).run(
      noteId,
      title,
      content,
      Date.now()
    )
    const excess = db
      .prepare(
        `SELECT id FROM note_versions WHERE note_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET ?`
      )
      .all(noteId, MAX_VERSIONS_PER_NOTE) as { id: number }[]
    if (excess.length) {
      const del = db.prepare(`DELETE FROM note_versions WHERE id = ?`)
      for (const row of excess) del.run(row.id)
    }
  })
  tx()
}

export function deleteVersionsForNote(noteId: number): void {
  getDb().prepare(`DELETE FROM note_versions WHERE note_id = ?`).run(noteId)
}
