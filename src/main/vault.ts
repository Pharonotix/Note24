import { app, dialog, type BrowserWindow } from 'electron'
import { copyFileSync, existsSync, rmSync } from 'fs'
import { join } from 'path'
import { getDb, closeDatabase } from './db/database'
import { resolveActiveLocation } from './locations'

/** Checkpoints the WAL into the main DB file, then copies it to a user-picked path. */
export async function backupVault(win: BrowserWindow | null): Promise<{ canceled: boolean; path?: string }> {
  if (!win) return { canceled: true }
  getDb().pragma('wal_checkpoint(FULL)')
  const dbPath = join(resolveActiveLocation(), 'note24.db')
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const res = await dialog.showSaveDialog(win, {
    defaultPath: `note24-backup-${stamp}.db`,
    filters: [{ name: 'Note24 Backup', extensions: ['db'] }]
  })
  if (res.canceled || !res.filePath) return { canceled: true }
  copyFileSync(dbPath, res.filePath)
  return { canceled: false, path: res.filePath }
}

/**
 * Replaces the active vault's DB file with a user-picked backup, then relaunches.
 * Closes the live DB connection first — the file is open (and on Windows, locked) by
 * the running process, so overwriting it without closing would fail or corrupt it.
 */
export async function restoreVault(win: BrowserWindow | null): Promise<{ canceled: boolean }> {
  if (!win) return { canceled: true }
  const res = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: 'Note24 Backup', extensions: ['db'] }]
  })
  if (res.canceled || !res.filePaths[0]) return { canceled: true }
  const backupPath = res.filePaths[0]
  const dbPath = join(resolveActiveLocation(), 'note24.db')

  closeDatabase()
  copyFileSync(backupPath, dbPath)
  // Drop stale WAL/SHM sidecars from the session being replaced — the restored file
  // should start clean, not replay write-ahead-log pages from the old database.
  for (const suffix of ['-wal', '-shm']) {
    const sidecar = dbPath + suffix
    if (existsSync(sidecar)) rmSync(sidecar)
  }

  app.relaunch()
  app.exit(0)
  return { canceled: false } // unreachable — app.exit() terminates the process
}
