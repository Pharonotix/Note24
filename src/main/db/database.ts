import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { join } from 'path'
import { migrations } from './migrations'
import { syncBuiltinEquations } from './seed-equations'
import { backfillAttachmentNoteLinks } from './attachmentBackfill'

let db: Database.Database | null = null

/** Returns the open database, throwing if it hasn't been initialized yet. */
export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized — call initDatabase() first')
  return db
}

/** Opens (creating if needed) the SQLite database at `dataDir` and runs pending migrations. */
export function initDatabase(dataDir: string): Database.Database {
  mkdirSync(dataDir, { recursive: true })
  const dbPath = join(dataDir, 'note24.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  syncBuiltinEquations()
  backfillAttachmentNoteLinks()
  return db
}

function runMigrations(conn: Database.Database): void {
  const current = conn.pragma('user_version', { simple: true }) as number
  for (let i = current; i < migrations.length; i++) {
    const sql = migrations[i]
    const apply = conn.transaction(() => {
      conn.exec(sql)
      conn.pragma(`user_version = ${i + 1}`)
    })
    apply()
  }
}

export function closeDatabase(): void {
  db?.close()
  db = null
}
