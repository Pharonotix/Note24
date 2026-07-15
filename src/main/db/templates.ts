import type { Template } from '@shared/types'
import { getDb } from './database'

interface TemplateRow {
  id: number
  name: string
  content: string
  created_at: number
}

function rowToTemplate(r: TemplateRow): Template {
  return { id: r.id, name: r.name, content: r.content, createdAt: r.created_at }
}

export function listTemplates(): Template[] {
  const rows = getDb()
    .prepare(`SELECT * FROM templates ORDER BY created_at DESC`)
    .all() as TemplateRow[]
  return rows.map(rowToTemplate)
}

export function createTemplate(name: string, content: string): Template {
  const ts = Date.now()
  const info = getDb()
    .prepare(`INSERT INTO templates (name, content, created_at) VALUES (?, ?, ?)`)
    .run(name.trim() || 'Untitled template', content, ts)
  const id = Number(info.lastInsertRowid)
  return rowToTemplate(
    getDb().prepare(`SELECT * FROM templates WHERE id = ?`).get(id) as TemplateRow
  )
}

export function renameTemplate(id: number, name: string): void {
  getDb()
    .prepare(`UPDATE templates SET name = ? WHERE id = ?`)
    .run(name.trim() || 'Untitled template', id)
}

export function deleteTemplate(id: number): void {
  getDb().prepare(`DELETE FROM templates WHERE id = ?`).run(id)
}
