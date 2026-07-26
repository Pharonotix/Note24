import type { Flashcard, FlashcardInput } from '@shared/types'
import { getDb } from './database'
import { listEquations } from './equations'

interface FlashcardRow {
  id: number
  front: string
  back: string
  back_format: string
  category: string
  source_slug: string | null
  interval_idx: number
  due_at: number
  last_reviewed_at: number | null
  created_at: number
  updated_at: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const REVIEW_INTERVALS_DAYS = [1, 3, 7, 14, 30]

function rowToFlashcard(r: FlashcardRow): Flashcard {
  return {
    id: r.id,
    front: r.front,
    back: r.back,
    backFormat: r.back_format === 'latex' ? 'latex' : 'text',
    category: r.category,
    sourceSlug: r.source_slug,
    intervalIdx: r.interval_idx,
    dueAt: r.due_at,
    lastReviewedAt: r.last_reviewed_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

export function listFlashcards(): Flashcard[] {
  const rows = getDb()
    .prepare(`SELECT * FROM flashcards ORDER BY due_at ASC`)
    .all() as FlashcardRow[]
  return rows.map(rowToFlashcard)
}

export function getFlashcard(id: number): Flashcard | null {
  const row = getDb().prepare(`SELECT * FROM flashcards WHERE id = ?`).get(id) as
    | FlashcardRow
    | undefined
  return row ? rowToFlashcard(row) : null
}

export function createFlashcard(input: FlashcardInput): Flashcard {
  const db = getDb()
  const ts = Date.now()
  const info = db
    .prepare(
      `INSERT INTO flashcards (front, back, back_format, category, source_slug, interval_idx, due_at, last_reviewed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, NULL, ?, ?)`
    )
    .run(
      input.front.trim(),
      input.back.trim(),
      input.backFormat ?? 'text',
      input.category ?? '',
      input.sourceSlug ?? null,
      ts,
      ts,
      ts
    )
  return getFlashcard(Number(info.lastInsertRowid))!
}

export function updateFlashcard(id: number, patch: Partial<FlashcardInput>): void {
  const existing = getFlashcard(id)
  if (!existing) return
  getDb()
    .prepare(
      `UPDATE flashcards SET front = ?, back = ?, back_format = ?, category = ?, updated_at = ? WHERE id = ?`
    )
    .run(
      patch.front !== undefined ? patch.front.trim() : existing.front,
      patch.back !== undefined ? patch.back.trim() : existing.back,
      patch.backFormat ?? existing.backFormat,
      patch.category !== undefined ? patch.category : existing.category,
      Date.now(),
      id
    )
}

export function deleteFlashcard(id: number): void {
  getDb().prepare(`DELETE FROM flashcards WHERE id = ?`).run(id)
}

/** Advances a card's spaced-repetition schedule after it's been reviewed. */
export function reviewFlashcard(id: number, correct: boolean): void {
  const existing = getFlashcard(id)
  if (!existing) return
  const now = Date.now()
  const intervalIdx = correct
    ? Math.min(existing.intervalIdx + 1, REVIEW_INTERVALS_DAYS.length - 1)
    : 0
  const dueAt = now + REVIEW_INTERVALS_DAYS[intervalIdx] * DAY_MS
  getDb()
    .prepare(
      `UPDATE flashcards SET interval_idx = ?, due_at = ?, last_reviewed_at = ?, updated_at = ? WHERE id = ?`
    )
    .run(intervalIdx, dueAt, now, now, id)
}

/**
 * Generates one flashcard per equation that doesn't already have one (idempotent —
 * safe to call repeatedly as the equation library grows). Returns the count created.
 */
export function generateFlashcardsFromEquations(): number {
  const db = getDb()
  const existingSlugs = new Set(
    (db.prepare(`SELECT source_slug FROM flashcards WHERE source_slug IS NOT NULL`).all() as {
      source_slug: string
    }[]).map((r) => r.source_slug)
  )
  const eligible = listEquations().filter((eq) => eq.slug && !existingSlugs.has(eq.slug))
  const ts = Date.now()
  const insert = db.prepare(
    `INSERT INTO flashcards (front, back, back_format, category, source_slug, interval_idx, due_at, last_reviewed_at, created_at, updated_at)
     VALUES (?, ?, 'latex', ?, ?, 0, ?, NULL, ?, ?)`
  )
  const tx = db.transaction(() => {
    for (const eq of eligible) {
      const front = eq.description ? `${eq.name} — ${eq.description}` : `What is the equation for: ${eq.name}?`
      insert.run(front, eq.latex, eq.category, eq.slug, ts, ts, ts)
    }
  })
  tx()
  return eligible.length
}
