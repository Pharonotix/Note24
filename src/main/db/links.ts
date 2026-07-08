import type { Backlink } from '@shared/types'
import { getDb } from './database'

interface PmNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: PmNode[]
}

/** Collects the target titles of every wiki-link node in a ProseMirror doc. */
function extractWikiTitles(contentJson: string): string[] {
  const titles = new Set<string>()
  try {
    const doc = JSON.parse(contentJson) as PmNode
    const walk = (n?: PmNode): void => {
      if (!n) return
      if (n.type === 'wikiLink' && n.attrs && typeof n.attrs.title === 'string') {
        const t = n.attrs.title.trim()
        if (t) titles.add(t)
      }
      n.content?.forEach(walk)
    }
    walk(doc)
  } catch {
    /* ignore malformed content */
  }
  return [...titles]
}

/** Rebuilds the outgoing links for a note from its content. */
export function syncLinks(sourceNoteId: number, contentJson: string): void {
  const db = getDb()
  const titles = extractWikiTitles(contentJson)
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM links WHERE source_note_id = ?`).run(sourceNoteId)
    const resolve = db.prepare(`SELECT id FROM notes WHERE title = ? LIMIT 1`)
    const insert = db.prepare(
      `INSERT INTO links (source_note_id, target_note_id, target_title) VALUES (?, ?, ?)`
    )
    for (const title of titles) {
      const row = resolve.get(title) as { id: number } | undefined
      insert.run(sourceNoteId, row?.id ?? null, title)
    }
  })
  tx()
}

/** Notes that link to the given note (matched by the note's current title). */
export function getBacklinks(noteId: number): Backlink[] {
  const db = getDb()
  const note = db.prepare(`SELECT title FROM notes WHERE id = ?`).get(noteId) as
    | { title: string }
    | undefined
  if (!note) return []
  return db
    .prepare(
      `SELECT DISTINCT l.source_note_id AS noteId, n.title AS title
       FROM links l JOIN notes n ON n.id = l.source_note_id
       WHERE l.target_title = ? AND l.source_note_id != ?
       ORDER BY n.title`
    )
    .all(note.title, noteId) as Backlink[]
}
