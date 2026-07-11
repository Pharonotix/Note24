/**
 * Shared domain types used across the main process, preload bridge, and renderer.
 * DB rows use snake_case columns; the repository layer maps them to these
 * camelCase domain objects so the renderer never sees SQL shapes.
 */

export interface Note {
  id: number
  title: string
  /** ProseMirror document, JSON-stringified. */
  content: string
  /** Note-wide draw-over Excalidraw scene (JSON string), or null when unused. */
  annotations: string | null
  folderId: number | null
  createdAt: number
  updatedAt: number
}

/** Lightweight shape for sidebar / search lists (no full content). */
export interface NoteSummary {
  id: number
  title: string
  folderId: number | null
  updatedAt: number
  tags: string[]
  sortOrder: number
}

export interface Folder {
  id: number
  name: string
  parentId: number | null
  color: string | null
  icon: string | null
  sortOrder: number
}

export interface Tag {
  id: number
  name: string
}

export interface EquationVariable {
  symbol: string
  meaning: string
  unit?: string
}

export interface Equation {
  id: number
  /** Stable identity across restarts (built-ins reseed, changing their id). */
  slug: string | null
  name: string
  latex: string
  description: string
  category: string
  variables: EquationVariable[]
  tags: string[]
  isBuiltin: boolean
  createdAt: number
  updatedAt: number
}

/** How one equation relates to another in the knowledge graph. */
export type RelationKind = 'related' | 'derives-from' | 'special-case-of'

export interface EquationRelationship {
  id: number
  fromSlug: string
  toSlug: string
  kind: RelationKind
}

/** A relationship resolved to the neighbouring equation, for the detail view. */
export interface EquationRelationshipView {
  id: number
  kind: RelationKind
  /** 'out' = this equation → neighbour; 'in' = neighbour → this equation. */
  direction: 'out' | 'in'
  equation: Equation
}

/** One step in an equation's stored derivation chain. */
export interface DerivationStep {
  latex: string
  note?: string
}

/** A user-defined folder Note24's database + attachments can live in. */
export interface DataLocation {
  id: string
  label: string
  path: string
}

export interface LocationsRegistry {
  locations: DataLocation[]
  activeId: string
}

/** Metadata for an embedded file; bytes live on disk in userData/attachments/. */
export interface Attachment {
  id: string
  filename: string
  mime: string
  size: number
  createdAt: number
}

/** A note that links to the current note (for the Backlinks panel). */
export interface Backlink {
  noteId: number
  title: string
}

/* ---- Input payloads ---- */

export interface NoteCreateInput {
  title?: string
  folderId?: number | null
}

export interface NoteUpdateInput {
  title?: string
  content?: string
  annotations?: string | null
  folderId?: number | null
}

export interface EquationInput {
  name: string
  latex: string
  description?: string
  category?: string
  variables?: EquationVariable[]
  tags?: string[]
}
