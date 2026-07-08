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
}

export interface Folder {
  id: number
  name: string
  parentId: number | null
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
