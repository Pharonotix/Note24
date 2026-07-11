import type { Equation, EquationInput, EquationVariable } from '@shared/types'
import { getDb } from './database'

interface EqRow {
  id: number
  slug: string | null
  name: string
  latex: string
  description: string
  category: string
  variables_json: string
  tags: string
  is_builtin: number
  created_at: number
  updated_at: number
}

const now = (): number => Date.now()

function rowToEq(r: EqRow): Equation {
  let variables: EquationVariable[] = []
  try {
    variables = JSON.parse(r.variables_json)
  } catch {
    variables = []
  }
  return {
    id: r.id,
    slug: r.slug ?? null,
    name: r.name,
    latex: r.latex,
    description: r.description,
    category: r.category,
    variables,
    tags: r.tags ? r.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    isBuiltin: r.is_builtin === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

export function listEquations(): Equation[] {
  const rows = getDb()
    .prepare(`SELECT * FROM equations ORDER BY is_builtin DESC, category, name`)
    .all() as EqRow[]
  return rows.map(rowToEq)
}

export function searchEquations(query: string): Equation[] {
  const q = query.trim().toLowerCase()
  if (!q) return listEquations()
  const like = `%${q}%`
  const rows = getDb()
    .prepare(
      `SELECT * FROM equations
       WHERE lower(name) LIKE ? OR lower(description) LIKE ? OR lower(category) LIKE ?
          OR lower(latex) LIKE ? OR lower(tags) LIKE ? OR lower(variables_json) LIKE ?
       ORDER BY is_builtin DESC, category, name`
    )
    .all(like, like, like, like, like, like) as EqRow[]
  return rows.map(rowToEq)
}

export function getEquation(id: number): Equation | null {
  const row = getDb().prepare(`SELECT * FROM equations WHERE id = ?`).get(id) as EqRow | undefined
  return row ? rowToEq(row) : null
}

export function getEquationBySlug(slug: string): Equation | null {
  const row = getDb().prepare(`SELECT * FROM equations WHERE slug = ?`).get(slug) as
    | EqRow
    | undefined
  return row ? rowToEq(row) : null
}

export function createEquation(input: EquationInput): Equation {
  const ts = now()
  const db = getDb()
  const info = db
    .prepare(
      `INSERT INTO equations
         (name, latex, description, category, variables_json, tags, is_builtin, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(
      input.name,
      input.latex,
      input.description ?? '',
      input.category ?? 'Custom',
      JSON.stringify(input.variables ?? []),
      (input.tags ?? []).join(','),
      ts,
      ts
    )
  const id = Number(info.lastInsertRowid)
  // Custom equations get a stable `custom-<id>` slug so they can carry
  // relationships/derivations like built-ins do.
  db.prepare(`UPDATE equations SET slug = ? WHERE id = ?`).run(`custom-${id}`, id)
  return getEquation(id)!
}

export function updateEquation(id: number, patch: Partial<EquationInput>): void {
  const existing = getEquation(id)
  if (!existing) return
  const merged = {
    name: patch.name ?? existing.name,
    latex: patch.latex ?? existing.latex,
    description: patch.description ?? existing.description,
    category: patch.category ?? existing.category,
    variables: patch.variables ?? existing.variables,
    tags: patch.tags ?? existing.tags
  }
  getDb()
    .prepare(
      `UPDATE equations SET name=?, latex=?, description=?, category=?, variables_json=?, tags=?, updated_at=? WHERE id=?`
    )
    .run(
      merged.name,
      merged.latex,
      merged.description,
      merged.category,
      JSON.stringify(merged.variables),
      merged.tags.join(','),
      now(),
      id
    )
}

export function deleteEquation(id: number): void {
  const db = getDb()
  const row = db.prepare(`SELECT slug FROM equations WHERE id = ?`).get(id) as
    | { slug: string | null }
    | undefined
  const tx = db.transaction(() => {
    if (row?.slug) {
      // Slug-keyed side tables have no SQL foreign keys — clean them up here.
      db.prepare(`DELETE FROM equation_relationships WHERE from_slug = ? OR to_slug = ?`).run(
        row.slug,
        row.slug
      )
      db.prepare(`DELETE FROM equation_derivations WHERE slug = ?`).run(row.slug)
    }
    db.prepare(`DELETE FROM equations WHERE id = ?`).run(id)
  })
  tx()
}
