import type { Folder } from '@shared/types'
import { getDb } from './database'

interface FolderRow {
  id: number
  name: string
  parent_id: number | null
}

function rowToFolder(r: FolderRow): Folder {
  return { id: r.id, name: r.name, parentId: r.parent_id }
}

export function listFolders(): Folder[] {
  const rows = getDb().prepare(`SELECT * FROM folders ORDER BY name`).all() as FolderRow[]
  return rows.map(rowToFolder)
}

export function createFolder(name: string, parentId: number | null = null): Folder {
  const info = getDb()
    .prepare(`INSERT INTO folders (name, parent_id) VALUES (?, ?)`)
    .run(name.trim() || 'New Folder', parentId)
  const id = Number(info.lastInsertRowid)
  return getDb().prepare(`SELECT * FROM folders WHERE id = ?`).get(id) as Folder
}

export function renameFolder(id: number, name: string): void {
  getDb().prepare(`UPDATE folders SET name = ? WHERE id = ?`).run(name.trim() || 'Folder', id)
}

export function deleteFolder(id: number): void {
  getDb().prepare(`DELETE FROM folders WHERE id = ?`).run(id)
}
