import type { Equation, EquationInput, EquationVariable } from '@shared/types'
import { getDb } from './database'

interface EqRow {
  id: number
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

export function createEquation(input: EquationInput): Equation {
  const ts = now()
  const info = getDb()
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
  return getEquation(Number(info.lastInsertRowid))!
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
  getDb().prepare(`DELETE FROM equations WHERE id = ?`).run(id)
}
