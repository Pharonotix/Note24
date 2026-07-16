import type { Citation, CitationInput } from '@shared/types'
import { getDb } from './database'
import { deleteCitationRefsFor } from './citationLinks'

interface CitationRow {
  id: number
  type: string
  title: string
  authors: string
  year: string
  publisher: string
  url: string
  doi: string
  attachment_id: string | null
  created_at: number
  updated_at: number
}

function rowToCitation(r: CitationRow): Citation {
  return {
    id: r.id,
    type: r.type as Citation['type'],
    title: r.title,
    authors: r.authors,
    year: r.year,
    publisher: r.publisher,
    url: r.url,
    doi: r.doi,
    attachmentId: r.attachment_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

export function listCitations(): Citation[] {
  const rows = getDb()
    .prepare(`SELECT * FROM citations ORDER BY updated_at DESC`)
    .all() as CitationRow[]
  return rows.map(rowToCitation)
}

export function searchCitations(query: string): Citation[] {
  const q = query.trim()
  if (!q) return listCitations()
  const like = `%${q}%`
  const rows = getDb()
    .prepare(
      `SELECT * FROM citations WHERE title LIKE ? OR authors LIKE ? OR publisher LIKE ?
       ORDER BY updated_at DESC`
    )
    .all(like, like, like) as CitationRow[]
  return rows.map(rowToCitation)
}

export function getCitation(id: number): Citation | null {
  const row = getDb().prepare(`SELECT * FROM citations WHERE id = ?`).get(id) as
    | CitationRow
    | undefined
  return row ? rowToCitation(row) : null
}

export function createCitation(input: CitationInput): Citation {
  const db = getDb()
  const ts = Date.now()
  const info = db
    .prepare(
      `INSERT INTO citations (type, title, authors, year, publisher, url, doi, attachment_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.type,
      input.title.trim(),
      input.authors ?? '',
      input.year ?? '',
      input.publisher ?? '',
      input.url ?? '',
      input.doi ?? '',
      input.attachmentId ?? null,
      ts,
      ts
    )
  return getCitation(Number(info.lastInsertRowid))!
}

export function updateCitation(id: number, patch: Partial<CitationInput>): void {
  const db = getDb()
  const existing = getCitation(id)
  if (!existing) return
  db.prepare(
    `UPDATE citations SET type = ?, title = ?, authors = ?, year = ?, publisher = ?, url = ?, doi = ?, attachment_id = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    patch.type ?? existing.type,
    patch.title !== undefined ? patch.title.trim() : existing.title,
    patch.authors !== undefined ? patch.authors : existing.authors,
    patch.year !== undefined ? patch.year : existing.year,
    patch.publisher !== undefined ? patch.publisher : existing.publisher,
    patch.url !== undefined ? patch.url : existing.url,
    patch.doi !== undefined ? patch.doi : existing.doi,
    patch.attachmentId !== undefined ? patch.attachmentId : existing.attachmentId,
    Date.now(),
    id
  )
}

export function deleteCitation(id: number): void {
  deleteCitationRefsFor(id)
  getDb().prepare(`DELETE FROM citations WHERE id = ?`).run(id)
}
