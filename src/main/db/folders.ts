import type { Folder } from '@shared/types'
import { getDb } from './database'
import { deleteAttachmentsForFolder } from '../attachments'

interface FolderRow {
  id: number
  name: string
  parent_id: number | null
  color: string | null
  icon: string | null
  sort_order: number
}

function rowToFolder(r: FolderRow): Folder {
  return {
    id: r.id,
    name: r.name,
    parentId: r.parent_id,
    color: r.color,
    icon: r.icon,
    sortOrder: r.sort_order
  }
}

export function listFolders(): Folder[] {
  const rows = getDb()
    .prepare(`SELECT * FROM folders ORDER BY sort_order, name`)
    .all() as FolderRow[]
  return rows.map(rowToFolder)
}

function nextSortOrder(parentId: number | null): number {
  const row = getDb()
    .prepare(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM folders
       WHERE parent_id IS ? `
    )
    .get(parentId) as { n: number }
  return row.n
}

export function createFolder(name: string, parentId: number | null = null): Folder {
  const info = getDb()
    .prepare(`INSERT INTO folders (name, parent_id, sort_order) VALUES (?, ?, ?)`)
    .run(name.trim() || 'New Folder', parentId, nextSortOrder(parentId))
  const id = Number(info.lastInsertRowid)
  return getDb().prepare(`SELECT * FROM folders WHERE id = ?`).get(id) as Folder
}

export function renameFolder(id: number, name: string): void {
  getDb().prepare(`UPDATE folders SET name = ? WHERE id = ?`).run(name.trim() || 'Folder', id)
}

export function updateFolderStyle(id: number, style: { color?: string | null; icon?: string | null }): void {
  const db = getDb()
  const existing = db.prepare(`SELECT * FROM folders WHERE id = ?`).get(id) as FolderRow | undefined
  if (!existing) return
  const color = style.color !== undefined ? style.color : existing.color
  const icon = style.icon !== undefined ? style.icon : existing.icon
  db.prepare(`UPDATE folders SET color = ?, icon = ? WHERE id = ?`).run(color, icon, id)
}

export function moveFolder(id: number, parentId: number | null): void {
  const db = getDb()
  db.prepare(`UPDATE folders SET parent_id = ?, sort_order = ? WHERE id = ?`).run(
    parentId,
    nextSortOrder(parentId),
    id
  )
}

/** Persists a new sibling order for every folder sharing the same parent. */
export function reorderFolders(parentId: number | null, orderedIds: number[]): void {
  const db = getDb()
  const stmt = db.prepare(`UPDATE folders SET sort_order = ?, parent_id = ? WHERE id = ?`)
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => stmt.run(i, parentId, id))
  })
  tx()
}

/** All folder ids nested (at any depth) under `id`, not including `id` itself. */
function descendantFolderIds(id: number): number[] {
  const rows = getDb()
    .prepare(
      `WITH RECURSIVE sub(id) AS (
         SELECT id FROM folders WHERE parent_id = ?
         UNION ALL
         SELECT f.id FROM folders f JOIN sub ON f.parent_id = sub.id
       )
       SELECT id FROM sub`
    )
    .all(id) as { id: number }[]
  return rows.map((r) => r.id)
}

export function deleteFolder(id: number): void {
  // Subfolders cascade at the SQL level (parent_id ON DELETE CASCADE), but their
  // directly-attached files don't — clean those up first for every folder in the subtree.
  for (const folderId of [id, ...descendantFolderIds(id)]) {
    deleteAttachmentsForFolder(folderId)
  }
  getDb().prepare(`DELETE FROM folders WHERE id = ?`).run(id)
}
