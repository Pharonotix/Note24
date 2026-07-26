// REPL driver for Note24 (Electron desktop app). Windows-native — no xvfb needed.
// Designed for agents: wrap in tmux/background shell, send commands, capture output.
//
// Prerequisite: `npm run build` must have been run recently (loads ./out/main/index.js).
import { _electron as electron } from 'playwright-core'
import * as readline from 'node:readline'
import * as fs from 'node:fs'
import * as path from 'node:path'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(APP_DIR, '.driver-shots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

// When stdout is redirected to a file/pipe (agent use), Node buffers writes
// asynchronously — a process.exit() right after a burst of console.log can drop
// unflushed output. Forcing the handle into blocking mode makes every write
// synchronous, so nothing gets lost before quit's process.exit(0).
if (process.stdout._handle && process.stdout._handle.setBlocking) {
  process.stdout._handle.setBlocking(true)
}

let app = null
let page = null

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/electron.exe')

const COMMANDS = {
  async launch() {
    if (app) return console.log('already launched')
    app = await electron.launch({
      executablePath: electronBin,
      args: [APP_DIR],
      timeout: 30_000
    })
    await new Promise((r) => setTimeout(r, 3_000))
    page = app.windows().find((w) => !w.url().startsWith('devtools://')) ?? (await app.firstWindow())
    await page.waitForLoadState('domcontentloaded').catch(() => {})
    console.log('launched.', app.windows().length, 'windows:')
    for (const w of app.windows()) console.log(' ', w.url())
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first')
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png')
    await page.screenshot({ path: f })
    console.log('screenshot:', f)
  },

  // DOM click, not Playwright locator coordinates — safest default for a single BrowserWindow app.
  async click(sel) {
    if (!page) return console.log('ERROR: launch first')
    const r = await page.evaluate((s) => {
      const el = document.querySelector(s)
      if (!el) return 'NOT_FOUND'
      el.click()
      return 'OK'
    }, sel)
    console.log('click', sel, '→', r)
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first')
    const r = await page.evaluate((t) => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')]
      const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t))
      if (!el) return 'NOT_FOUND'
      el.click()
      return 'OK: ' + el.tagName
    }, text)
    console.log('click-text', JSON.stringify(text), '→', r)
  },

  async type(text) {
    if (page) await page.keyboard.type(text, { delay: 20 })
  },
  async press(key) {
    if (page) await page.keyboard.press(key)
  },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first')
    try {
      await page.waitForSelector(sel, { timeout: 10_000 })
      console.log('found:', sel)
    } catch {
      console.log('TIMEOUT:', sel)
    }
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first')
    try {
      console.log(JSON.stringify(await page.evaluate(expr)))
    } catch (e) {
      console.log('ERROR:', e.message)
    }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first')
    console.log(
      await page.evaluate((s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)', sel || null)
    )
  },

  async windows() {
    if (!app) return console.log('ERROR: launch first')
    for (const w of app.windows()) console.log(' ', w.url())
  },

  async quit() {
    if (app) await app.close().catch(() => {})
    app = null
    page = null
  },
  help() {
    console.log('commands:', Object.keys(COMMANDS).join(', '))
  }
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'driver> ' })

// Piped stdin (agent use) delivers all lines before any async handler resolves, so
// queue commands and run them strictly one-at-a-time instead of relying on readline's
// 'line' event ordering (it does NOT wait for a previous async handler to finish).
let queue = Promise.resolve()

// Piped stdin hits EOF (and closes `rl`) as soon as all lines are read — long before
// the queued async commands above have actually run their course. Swallow the
// resulting "readline was closed" error from a late `.prompt()` call; we're tearing
// down anyway once the queue drains (see the 'close' handler below).
const safePrompt = () => {
  try {
    rl.prompt()
  } catch {
    /* interface already closed (piped-stdin EOF beat us here) — fine to ignore */
  }
}

rl.on('line', (line) => {
  queue = queue.then(async () => {
    const [cmd, ...rest] = line.trim().split(/\s+/)
    if (!cmd) return safePrompt()
    const fn = COMMANDS[cmd]
    if (!fn) {
      console.log('unknown:', cmd, '— try: help')
      return safePrompt()
    }
    try {
      await fn(rest.join(' '))
    } catch (e) {
      console.log('ERROR:', e.message)
    }
    if (cmd === 'quit') {
      rl.close()
      process.exit(0)
    }
    safePrompt()
  })
})
rl.on('close', async () => {
  // Piped stdin hits EOF (and fires 'close') as soon as all lines are read, which is
  // almost immediately — long before the queued async commands (e.g. `launch`) have
  // actually finished. Wait for the queue to drain before tearing down, or a scripted
  // run exits before `launch`/`quit` ever really ran.
  await queue
  if (app) await COMMANDS.quit()
  process.exit(0)
})

console.log('Note24 driver — "help" for commands, "launch" to start')
rl.prompt()
