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
const consoleLog = []

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
    page.on('console', (msg) => consoleLog.push(`[${msg.type()}] ${msg.text()}`))
    page.on('pageerror', (err) => consoleLog.push(`[pageerror] ${err.message}`))
    // Electron's default `backgroundThrottling: true` fully suspends timers/rAF for an
    // unfocused BrowserWindow — and this window never gets real OS focus under
    // automation. Force focus so debounced-save timers (autosave, etc.) actually run;
    // without this, any code waiting on setTimeout/setInterval appears to hang forever.
    await page.bringToFront().catch(() => {})
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.focus()).catch(() => {})
    console.log('launched.', app.windows().length, 'windows:')
    for (const w of app.windows()) console.log(' ', w.url())
  },

  // Prints (and clears) captured browser console/pageerror messages since launch/last call.
  async logs() {
    console.log(consoleLog.length ? consoleLog.join('\n') : '(no console output captured)')
    consoleLog.length = 0
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

  // Real mouse drag via page.mouse — needed for canvas/SVG interactions (e.g. React
  // Flow edge-connect handles) where a DOM .click() can't express a drag gesture.
  // Usage: drag x1,y1 x2,y2 (screenshot-pixel coordinates).
  async drag(args) {
    if (!page) return console.log('ERROR: launch first')
    const [from, to] = args.split(/\s+/)
    const [x1, y1] = from.split(',').map(Number)
    const [x2, y2] = to.split(',').map(Number)
    await page.mouse.move(x1, y1)
    await page.mouse.down()
    await page.mouse.move((x1 + x2) / 2, (y1 + y2) / 2, { steps: 5 })
    await page.mouse.move(x2, y2, { steps: 5 })
    await page.mouse.up()
    console.log('drag', from, '→', to)
  },
  async press(key) {
    if (page) await page.keyboard.press(key)
  },

  // React-Flow-specific: drags from a source handle on the Nth `.react-flow__node`
  // to a target handle on the Mth one (0-indexed, DOM order). Targets the actual
  // `.react-flow__handle` elements' centers (not the node's own bounding box —
  // handles are small ~10px hit targets, and missing them by a few px silently
  // fails the connection without any error, which is flaky if you approximate
  // from the node rect instead).
  async 'connect-nodes'(args) {
    if (!page) return console.log('ERROR: launch first')
    const [i, j] = args.split(/\s+/).map(Number)
    const handles = await page.evaluate(() =>
      [...document.querySelectorAll('.react-flow__node')].map((n) => {
        const center = (el) => {
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
        }
        return {
          source: center(n.querySelector('.react-flow__handle-bottom.source, .react-flow__handle.source')),
          target: center(n.querySelector('.react-flow__handle-top.target, .react-flow__handle.target'))
        }
      })
    )
    if (!handles[i]?.source || !handles[j]?.target) {
      return console.log('connect-nodes: handle not found', JSON.stringify(handles))
    }
    const from = handles[i].source
    const to = handles[j].target
    // Small pauses between steps: React Flow's connection state machine listens for
    // pointerdown/pointermove and needs a beat to register the drag start — a fully
    // instantaneous CDP-dispatched down→move→up sequence can silently fail to start
    // a connection at all (no error, just no edge).
    await page.mouse.move(from.x, from.y)
    await page.waitForTimeout(100)
    await page.mouse.down()
    await page.waitForTimeout(100)
    await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 10 })
    await page.waitForTimeout(100)
    await page.mouse.move(to.x, to.y, { steps: 10 })
    await page.waitForTimeout(100)
    await page.mouse.up()
    console.log('connect-nodes', i, '→', j, JSON.stringify({ from, to }))
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
