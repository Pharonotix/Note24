import type {
  DerivationStep,
  Equation,
  EquationRelationship,
  EquationRelationshipView,
  RelationKind
} from '@shared/types'
import { getDb } from './database'
import { getEquationBySlug } from './equations'

const KINDS: RelationKind[] = ['related', 'derives-from', 'special-case-of']
function normalizeKind(kind: string): RelationKind {
  return (KINDS as string[]).includes(kind) ? (kind as RelationKind) : 'related'
}

interface RelRow {
  id: number
  from_slug: string
  to_slug: string
  kind: string
}

function rowToRel(r: RelRow): EquationRelationship {
  return { id: r.id, fromSlug: r.from_slug, toSlug: r.to_slug, kind: normalizeKind(r.kind) }
}

export function listRelationships(): EquationRelationship[] {
  const rows = getDb().prepare(`SELECT * FROM equation_relationships`).all() as RelRow[]
  return rows.map(rowToRel)
}

/**
 * Every relationship touching `slug`, resolved to the neighbouring equation and
 * annotated with direction. 'out' means this equation points at the neighbour
 * (from_slug === slug); 'in' means the neighbour points at this equation — e.g.
 * an incoming 'derives-from' is where this equation is *used in* deriving another.
 */
export function relationshipsFor(slug: string): EquationRelationshipView[] {
  const rows = getDb()
    .prepare(`SELECT * FROM equation_relationships WHERE from_slug = ? OR to_slug = ?`)
    .all(slug, slug) as RelRow[]
  const views: EquationRelationshipView[] = []
  for (const r of rows) {
    const direction: 'out' | 'in' = r.from_slug === slug ? 'out' : 'in'
    const otherSlug = direction === 'out' ? r.to_slug : r.from_slug
    const equation = getEquationBySlug(otherSlug)
    if (equation) views.push({ id: r.id, kind: normalizeKind(r.kind), direction, equation })
  }
  return views
}

export function addRelationship(fromSlug: string, toSlug: string, kind: RelationKind): void {
  if (!fromSlug || !toSlug || fromSlug === toSlug) return
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO equation_relationships (from_slug, to_slug, kind) VALUES (?, ?, ?)`
    )
    .run(fromSlug, toSlug, normalizeKind(kind))
}

export function removeRelationship(id: number): void {
  getDb().prepare(`DELETE FROM equation_relationships WHERE id = ?`).run(id)
}

export function getDerivation(slug: string): DerivationStep[] {
  const row = getDb()
    .prepare(`SELECT steps_json FROM equation_derivations WHERE slug = ?`)
    .get(slug) as { steps_json: string } | undefined
  if (!row) return []
  try {
    const parsed = JSON.parse(row.steps_json)
    return Array.isArray(parsed) ? (parsed as DerivationStep[]) : []
  } catch {
    return []
  }
}

export function setDerivation(slug: string, steps: DerivationStep[]): void {
  const clean = (steps ?? []).filter((s) => s && s.latex.trim())
  const db = getDb()
  if (clean.length === 0) {
    db.prepare(`DELETE FROM equation_derivations WHERE slug = ?`).run(slug)
    return
  }
  db.prepare(
    `INSERT INTO equation_derivations (slug, steps_json) VALUES (?, ?)
     ON CONFLICT(slug) DO UPDATE SET steps_json = excluded.steps_json`
  ).run(slug, JSON.stringify(clean))
}

/** Convenience for a future graph view: all equations that have at least one relationship. */
export function graphEquations(): Equation[] {
  const db = getDb()
  const slugs = new Set<string>()
  for (const r of db.prepare(`SELECT from_slug, to_slug FROM equation_relationships`).all() as {
    from_slug: string
    to_slug: string
  }[]) {
    slugs.add(r.from_slug)
    slugs.add(r.to_slug)
  }
  const eqs: Equation[] = []
  for (const s of slugs) {
    const eq = getEquationBySlug(s)
    if (eq) eqs.push(eq)
  }
  return eqs
}
