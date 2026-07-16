import type { CitationUsage } from '@shared/types'
import { getDb } from './database'

interface PmNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: PmNode[]
}

/** Collects the citation ids referenced by every citationRef node in a ProseMirror doc. */
function extractCitationIds(contentJson: string): number[] {
  const ids = new Set<number>()
  try {
    const doc = JSON.parse(contentJson) as PmNode
    const walk = (n?: PmNode): void => {
      if (!n) return
      if (n.type === 'citationRef' && n.attrs) {
        const id = Number(n.attrs.citationId)
        if (Number.isFinite(id) && id > 0) ids.add(id)
      }
      n.content?.forEach(walk)
    }
    walk(doc)
  } catch {
    /* ignore malformed content */
  }
  return [...ids]
}

/** Rebuilds the outgoing citation references for a note from its content. */
export function syncCitationRefs(sourceNoteId: number, contentJson: string): void {
  const db = getDb()
  const ids = extractCitationIds(contentJson)
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM citation_refs WHERE source_note_id = ?`).run(sourceNoteId)
    const insert = db.prepare(
      `INSERT OR IGNORE INTO citation_refs (source_note_id, citation_id) VALUES (?, ?)`
    )
    for (const id of ids) insert.run(sourceNoteId, id)
  })
  tx()
}

/** Notes that reference the given citation — the citation's "used in" list. */
export function getCitationUsage(citationId: number): CitationUsage[] {
  return getDb()
    .prepare(
      `SELECT DISTINCT cr.source_note_id AS noteId, n.title AS title
       FROM citation_refs cr JOIN notes n ON n.id = cr.source_note_id
       WHERE cr.citation_id = ?
       ORDER BY n.title`
    )
    .all(citationId) as CitationUsage[]
}

/** Removes every reference row for a citation — called when the citation itself is deleted. */
export function deleteCitationRefsFor(citationId: number): void {
  getDb().prepare(`DELETE FROM citation_refs WHERE citation_id = ?`).run(citationId)
}
