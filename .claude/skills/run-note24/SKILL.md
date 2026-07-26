---
name: run-note24
description: Build, run, and drive the Note24 Electron desktop app for UI verification. Use when asked to start Note24, take a screenshot of it, or interact with its UI to verify a change.
---

Note24 is a Windows Electron desktop app (no xvfb needed — this machine runs it
natively). Drive it via the Playwright `_electron` REPL at
`.claude/skills/run-note24/driver.mjs`. Electron launch takes a few seconds; the
driver waits after `launch` before grabbing the window.

All paths are relative to the repo root (`C:\Note24`).

## Build

```bash
npm run build   # runs typecheck + electron-vite build; writes ./out/main/index.js etc.
```

The driver launches `electron.exe <repo-root>`, which reads `package.json`'s
`"main": "./out/main/index.js"` — so **run `npm run build` first** whenever source
has changed since the last build.

## Run (agent path)

The driver is a REPL over stdin. For a single scripted sequence, pipe newline-separated
commands into it and redirect to a log file (don't rely on `timeout`'s exit alone —
electron launch + your interactions can take 30–60s+, and SIGTERM can truncate buffered
output). Prefer running in the background and reading the log after:

```bash
printf 'launch\nss 01-start\nclick-text "Study"\nss 02-study\nquit\n' \
  > .driver-commands.txt   # (or just printf directly into the pipe)

node .claude/skills/run-note24/driver.mjs < .driver-commands.txt > driver-run.log 2>&1
```

Give it 60s+ of headroom (cold Electron start + native module load can be slow the
first time). Screenshots land in `.driver-shots/` (override: `SCREENSHOT_DIR`).

### Commands

| command | what it does |
|---|---|
| `launch` | launch the app, wait for the window |
| `ss [name]` | screenshot → `.driver-shots/<name>.png` |
| `click <css-sel>` | click element via DOM `.click()` (not Playwright coordinates) |
| `click-text <text>` | click the first button/link/`[role=button]` containing `text` |
| `type <text>` / `press <key>` | keyboard input (use for TipTap/contentEditable — `fill()` won't work) |
| `wait <css-sel>` | wait up to 10s for a selector |
| `eval <js>` | evaluate an expression in the page, print JSON |
| `text [css-sel]` | print `innerText` of a selector (or `document.body`) |
| `windows` | list Electron windows (only one BrowserWindow in this app) |
| `quit` | close the app, exit the driver |

## Run (human path)

```bash
npm run dev     # electron-vite dev, hot reload
npm start       # electron-vite preview — runs the last `npm run build` output
```

## Gotchas

- **This app has exactly one `BrowserWindow`** — no BrowserView/webview split, no
  splash screen. `app.firstWindow()` is always the real UI; no window-hunting needed.
- **Piped stdin delivers all lines before any async handler resolves.** The driver
  serializes commands through a promise queue (`rl.on('line', ...)` chains onto a
  running `queue` promise) — don't remove that if you edit the driver, or `launch`
  will race with the commands after it.
- **The editor body is TipTap (ProseMirror/contentEditable).** Use `type`/`press`,
  not a `fill()`-style command, to enter text into it.
- **The dev vault persists real note/equation/citation data** across runs (SQLite at
  `%APPDATA%\note24\note24.db`). Verification flows that create notes/cards for testing
  leave them behind — that's expected (existing data is sacred; don't delete rows a
  test didn't create), but avoid renaming/deleting anything pre-existing while poking
  around.
- **Close the driver (`quit`) when done** — an orphaned `electron.exe` holds the SQLite
  file open (WAL mode) and can make the next launch's writes appear to stall.
