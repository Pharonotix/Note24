import { writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

/**
 * Registered as the very first main-process import so it can capture failures
 * that occur while other modules (e.g. native addons) are still loading.
 */
function log(prefix: string, err: unknown): void {
  try {
    const e = err as Error
    writeFileSync(
      join(tmpdir(), 'note24-crash.log'),
      `${new Date().toISOString()} ${prefix}\n${e?.stack || String(err)}\n`
    )
  } catch {
    /* ignore */
  }
}

process.on('uncaughtException', (err) => log('uncaughtException', err))
process.on('unhandledRejection', (err) => log('unhandledRejection', err))
