import { app } from 'electron'
import { join, basename, extname } from 'path'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Attachment } from '@shared/types'
import { getDb } from './db/database'

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.csv': 'text/csv'
}

export function mimeFromName(name: string): string {
  return MIME_BY_EXT[extname(name).toLowerCase()] || 'application/octet-stream'
}

function attachmentsDir(): string {
  const dir = join(app.getPath('userData'), 'attachments')
  mkdirSync(dir, { recursive: true })
  return dir
}

function pathFor(id: string): string {
  return join(attachmentsDir(), id)
}

function rowToAttachment(r: {
  id: string
  filename: string
  mime: string
  size: number
  created_at: number
}): Attachment {
  return { id: r.id, filename: r.filename, mime: r.mime, size: r.size, createdAt: r.created_at }
}

export function addAttachment(filename: string, mime: string, data: Uint8Array): Attachment {
  const id = randomUUID()
  const buf = Buffer.from(data)
  writeFileSync(pathFor(id), buf)
  const ts = Date.now()
  getDb()
    .prepare(`INSERT INTO attachments (id, filename, mime, size, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(id, filename, mime || mimeFromName(filename), buf.length, ts)
  return { id, filename, mime: mime || mimeFromName(filename), size: buf.length, createdAt: ts }
}

export function addAttachmentFromPath(filePath: string): Attachment {
  const data = readFileSync(filePath)
  const filename = basename(filePath)
  return addAttachment(filename, mimeFromName(filename), data)
}

export function getAttachment(id: string): Attachment | null {
  const r = getDb().prepare(`SELECT * FROM attachments WHERE id = ?`).get(id) as
    | { id: string; filename: string; mime: string; size: number; created_at: number }
    | undefined
  return r ? rowToAttachment(r) : null
}

export function readAttachmentBytes(id: string): { data: Buffer; mime: string } | null {
  const meta = getAttachment(id)
  if (!meta) return null
  const p = pathFor(id)
  if (!existsSync(p)) return null
  return { data: readFileSync(p), mime: meta.mime }
}

export function attachmentFsPath(id: string): string | null {
  const p = pathFor(id)
  return existsSync(p) ? p : null
}

export function deleteAttachment(id: string): void {
  const p = pathFor(id)
  if (existsSync(p)) unlinkSync(p)
  getDb().prepare(`DELETE FROM attachments WHERE id = ?`).run(id)
}
