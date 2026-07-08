# Note24

A personal, offline-first physics notebook — an Obsidian-inspired desktop app with rendered
equations, a searchable equation library, embeddable Desmos graphs, drawings, file attachments, and
linked notes.

## Features

- **Rich block editor** (TipTap) with autosave to a local SQLite database.
- **Equations** — write LaTeX inline or as blocks (rendered with KaTeX). Click any equation to edit.
- **Equation library** — 87 built-in physics equations across 18 categories, fully searchable, plus
  add/edit/delete your own. Insert into any note. Open with the **Σ Equations** button or `Ctrl+E`.
- **Desmos graphs** — embed the real Desmos calculator (📈 toolbar button). Resize by dragging the
  corner, double-click / "Edit graph" to add expressions. Graph state is saved with the note.
- **Attachments** — drag, paste, or pick images (rendered inline & resizable) and other files
  (opened externally via a chip). Stored under the app data folder.
- **Drawing** — insert Excalidraw canvases (✎ toolbar), or toggle **Annotate** to draw freehand over
  a whole note. Text can be highlighted in four colors.
- **Wiki-links & backlinks** — type `[[` to link or create notes; each note lists its "Linked
  mentions".
- **Organisation** — folders (drag notes to move), tags, full-text search, and a `Ctrl+O` quick
  switcher.
- **Theming** — soft-toned presets (greens/greys, light & dark), primary/secondary color pickers,
  and an advanced RGB editor for every color token. Open with **⚙** or `Ctrl+,`.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` | New note |
| `Ctrl+O` | Quick switcher |
| `Ctrl+E` | Toggle equation library |
| `Ctrl+,` | Settings |

## Requirements

- Windows 10/11.
- [Node.js](https://nodejs.org) LTS (for development / building only).

## Development

```bash
npm install      # installs deps; rebuilds better-sqlite3 for Electron
npm run dev      # launch the app with hot reload
npm run typecheck
npm run build    # typecheck + production build (out/)
```

## Building the installer

```bash
npm run build:win
```

Produces `dist/note24-<version>-setup.exe` (NSIS installer) plus a portable `dist/win-unpacked/`
folder. The app is packaged with `asar: false` (files unpacked) — this is required because Excalidraw
bundles a large Mermaid engine that does not run reliably from inside an asar archive.

## Notes & caveats

- **Data location:** notes/equations/settings live in a SQLite DB, and attachment files in an
  `attachments/` folder, both under `%APPDATA%\note24` (dev) / the packaged app's user-data folder.
- **Desmos requires internet** to load its engine, and a free API key (set yours in Settings →
  Desmos; the public demo key is used until then). Graph editing after load is local.
- **Excalidraw hand-drawn fonts** load from a CDN; offline, drawings fall back to system fonts but
  remain fully functional.

## Tech stack

Electron · React · TypeScript · Vite (electron-vite) · better-sqlite3 · TipTap/ProseMirror · KaTeX ·
Desmos API · Excalidraw · Zustand · electron-builder.
