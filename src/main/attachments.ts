import { join, basename, extname } from 'path'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Attachment, AttachmentFilter, AttachmentTarget } from '@shared/types'
import { getDb } from './db/database'

let baseDir: string | null = null

/** Sets the folder (the active data location) attachments are stored under. */
export function setAttachmentsBaseDir(dir: string): void {
  baseDir = dir
}

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
  '.csv': 'text/csv',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

/** Extensions offered by the native "Attach file" picker dialog. */
export const PICKABLE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp',
  'pdf', 'txt', 'md', 'csv',
  'mp3', 'wav', 'ogg', 'm4a', 'flac',
  'mp4', 'webm', 'mov', 'avi',
  'zip', 'doc', 'docx'
]

export function mimeFromName(name: string): string {
  return MIME_BY_EXT[extname(name).toLowerCase()] || 'application/octet-stream'
}

function attachmentsDir(): string {
  if (!baseDir) throw new Error('Attachments base dir not set — call setAttachmentsBaseDir() first')
  const dir = join(baseDir, 'attachments')
  mkdirSync(dir, { recursive: true })
  return dir
}

function pathFor(id: string): string {
  return join(attachmentsDir(), id)
}

interface AttachmentRow {
  id: string
  filename: string
  mime: string
  size: number
  created_at: number
  note_id: number | null
  folder_id: number | null
}

function rowToAttachment(r: AttachmentRow): Attachment {
  return {
    id: r.id,
    filename: r.filename,
    mime: r.mime,
    size: r.size,
    createdAt: r.created_at,
    noteId: r.note_id,
    folderId: r.folder_id
  }
}

export function addAttachment(
  filename: string,
  mime: string,
  data: Uint8Array,
  target: AttachmentTarget = {}
): Attachment {
  const id = randomUUID()
  const buf = Buffer.from(data)
  writeFileSync(pathFor(id), buf)
  const ts = Date.now()
  const noteId = target.noteId ?? null
  const folderId = target.folderId ?? null
  getDb()
    .prepare(
      `INSERT INTO attachments (id, filename, mime, size, created_at, note_id, folder_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, filename, mime || mimeFromName(filename), buf.length, ts, noteId, folderId)
  return {
    id,
    filename,
    mime: mime || mimeFromName(filename),
    size: buf.length,
    createdAt: ts,
    noteId,
    folderId
  }
}

export function addAttachmentFromPath(filePath: string, target: AttachmentTarget = {}): Attachment {
  const data = readFileSync(filePath)
  const filename = basename(filePath)
  return addAttachment(filename, mimeFromName(filename), data, target)
}

export function getAttachment(id: string): Attachment | null {
  const r = getDb().prepare(`SELECT * FROM attachments WHERE id = ?`).get(id) as
    | AttachmentRow
    | undefined
  return r ? rowToAttachment(r) : null
}

/** Lists attachments, optionally scoped to a note/folder and/or filtered by filename. */
export function listAttachments(filter: AttachmentFilter = {}): Attachment[] {
  const clauses: string[] = []
  const params: unknown[] = []
  if (filter.noteId !== undefined) {
    clauses.push('note_id = ?')
    params.push(filter.noteId)
  }
  if (filter.folderId !== undefined) {
    clauses.push('folder_id = ?')
    params.push(filter.folderId)
  }
  if (filter.query?.trim()) {
    clauses.push('filename LIKE ?')
    params.push(`%${filter.query.trim()}%`)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = getDb()
    .prepare(`SELECT * FROM attachments ${where} ORDER BY created_at DESC`)
    .all(...params) as AttachmentRow[]
  return rows.map(rowToAttachment)
}

export function renameAttachment(id: string, filename: string): void {
  const name = filename.trim()
  if (!name) return
  getDb().prepare(`UPDATE attachments SET filename = ? WHERE id = ?`).run(name, id)
}

/** Reassigns an attachment's link — always sets both fields (moving to a note clears folder, and vice versa). */
export function moveAttachment(id: string, target: AttachmentTarget): void {
  getDb()
    .prepare(`UPDATE attachments SET note_id = ?, folder_id = ? WHERE id = ?`)
    .run(target.noteId ?? null, target.folderId ?? null, id)
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

/** Deletes every attachment linked to a note (files + rows) — called when the note is deleted. */
export function deleteAttachmentsForNote(noteId: number): void {
  const ids = getDb().prepare(`SELECT id FROM attachments WHERE note_id = ?`).all(noteId) as {
    id: string
  }[]
  for (const { id } of ids) deleteAttachment(id)
}

/** Deletes every attachment linked directly to a folder (files + rows) — called when the folder is deleted. */
export function deleteAttachmentsForFolder(folderId: number): void {
  const ids = getDb().prepare(`SELECT id FROM attachments WHERE folder_id = ?`).all(folderId) as {
    id: string
  }[]
  for (const { id } of ids) deleteAttachment(id)
}
