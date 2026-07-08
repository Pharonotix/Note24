import type { Note, NoteCreateInput, NoteSummary, NoteUpdateInput } from '@shared/types'
import { getDb } from './database'
import { extractPlaintext } from './plaintext'
import { syncLinks } from './links'

interface NoteRow {
  id: number
  title: string
  content: string
  annotations: string | null
  folder_id: number | null
  created_at: number
  updated_at: number
}

const EMPTY_DOC = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] })

const now = (): number => Date.now()

function rowToNote(r: NoteRow): Note {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    annotations: r.annotations,
    folderId: r.folder_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

function tagsFor(noteId: number): string[] {
  const rows = getDb()
    .prepare(`SELECT t.name FROM note_tags nt JOIN tags t ON t.id = nt.tag_id WHERE nt.note_id = ? ORDER BY t.name`)
    .all(noteId) as { name: string }[]
  return rows.map((r) => r.name)
}

function summarize(r: { id: number; title: string; folder_id: number | null; updated_at: number }): NoteSummary {
  return { id: r.id, title: r.title, folderId: r.folder_id, updatedAt: r.updated_at, tags: tagsFor(r.id) }
}

export function listNotes(): NoteSummary[] {
  const rows = getDb()
    .prepare(`SELECT id, title, folder_id, updated_at FROM notes ORDER BY updated_at DESC`)
    .all() as { id: number; title: string; folder_id: number | null; updated_at: number }[]
  return rows.map(summarize)
}

export function getNote(id: number): Note | null {
  const row = getDb().prepare(`SELECT * FROM notes WHERE id = ?`).get(id) as NoteRow | undefined
  return row ? rowToNote(row) : null
}

export function createNote(input: NoteCreateInput = {}): Note {
  const db = getDb()
  const ts = now()
  const title = input.title ?? 'Untitled'
  const info = db
    .prepare(
      `INSERT INTO notes (title, content, annotations, folder_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, EMPTY_DOC, null, input.folderId ?? null, ts, ts)
  const id = Number(info.lastInsertRowid)
  syncFts(id, title, '')
  return getNote(id)!
}

export function updateNote(id: number, patch: NoteUpdateInput): void {
  const db = getDb()
  const existing = getNote(id)
  if (!existing) return
  const title = patch.title ?? existing.title
  const content = patch.content ?? existing.content
  const annotations = patch.annotations !== undefined ? patch.annotations : existing.annotations
  const folderId = patch.folderId !== undefined ? patch.folderId : existing.folderId
  db.prepare(
    `UPDATE notes SET title = ?, content = ?, annotations = ?, folder_id = ?, updated_at = ? WHERE id = ?`
  ).run(title, content, annotations, folderId, now(), id)
  syncFts(id, title, extractPlaintext(content))
  if (patch.content !== undefined) syncLinks(id, content)
}

export function deleteNote(id: number): void {
  const db = getDb()
  db.prepare(`DELETE FROM notes WHERE id = ?`).run(id)
  db.prepare(`DELETE FROM notes_fts WHERE rowid = ?`).run(id)
}

export function searchNotes(query: string): NoteSummary[] {
  const q = query.trim()
  if (!q) return listNotes()
  // Prefix match on each token; quote to neutralize FTS operators.
  const match = q
    .split(/\s+/)
    .map((t) => `"${t.replace(/"/g, '""')}"*`)
    .join(' ')
  try {
    const rows = getDb()
      .prepare(
        `SELECT n.id, n.title, n.folder_id, n.updated_at
         FROM notes_fts f JOIN notes n ON n.id = f.rowid
         WHERE notes_fts MATCH ?
         ORDER BY rank`
      )
      .all(match) as { id: number; title: string; folder_id: number | null; updated_at: number }[]
    return rows.map(summarize)
  } catch {
    return []
  }
}

export function setNoteTags(noteId: number, tagNames: string[]): void {
  const db = getDb()
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM note_tags WHERE note_id = ?`).run(noteId)
    const insTag = db.prepare(`INSERT INTO tags(name) VALUES (?) ON CONFLICT(name) DO NOTHING`)
    const getTag = db.prepare(`SELECT id FROM tags WHERE name = ?`)
    const link = db.prepare(`INSERT OR IGNORE INTO note_tags(note_id, tag_id) VALUES (?, ?)`)
    for (const raw of tagNames) {
      const name = raw.trim()
      if (!name) continue
      insTag.run(name)
      const tag = getTag.get(name) as { id: number }
      link.run(noteId, tag.id)
    }
  })
  tx()
}

function syncFts(id: number, title: string, body: string): void {
  const db = getDb()
  db.prepare(`DELETE FROM notes_fts WHERE rowid = ?`).run(id)
  db.prepare(`INSERT INTO notes_fts(rowid, title, body) VALUES (?, ?, ?)`).run(id, title, body)
}
