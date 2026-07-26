# Changelog

All notable changes to Note24. Newest first.

## 0.12.0 — Infinite Whiteboard

### Added
- **Infinite Whiteboard** (topbar button) — a full-screen, freehand-drawable canvas (the
  existing Excalidraw engine) that also holds reference "cards" for Notes, Equations,
  PDFs, and Graphs, dropped from a searchable picker and freely dragged around.
  - **Note cards** — click to jump straight to that note.
  - **Equation cards** — a live-rendered LaTeX preview of an equation from the library.
  - **PDF cards** — click opens the PDF in the existing in-app viewer.
  - **Graph cards** — a small live, editable Desmos calculator embedded directly on the
    board (not just a static reference).
  - One shared board for the whole vault, persisted as a single JSON blob under the
    existing `settings` key/value store — no new database table or migration needed.

### Notes
- Found and fixed a genuine React crash (error #185, "maximum update depth exceeded")
  during testing: syncing Excalidraw's live pan/zoom into this component's own React
  state on every single `onChange` event (which fires very frequently) created a
  same-tick render cascade with Excalidraw's internal reflow. Fixed by (a) keeping the
  drawn scene itself in a ref, never in state — only the overlay cards' positions need
  Excalidraw's pan/zoom, and the debounced disk-save reads the ref directly — and (b)
  coalescing that pan/zoom sync to at most once per animation frame instead of once per
  `onChange` call.
  - Also fixed the overlay cards rendering with correct DOM position and content but
    invisibly stacked underneath Excalidraw's own canvas (no explicit `z-index` on the
    overlay layer).
- No new dependencies — reuses the existing Excalidraw and Desmos integrations.

## 0.11.0 — Flowcharts

### Added
- **Flowchart block** (toolbar button, "Insert flowchart") — a new TipTap block backed by
  React Flow (`@xyflow/react`), for flowcharts, mind maps, and dependency maps. Lazily
  loaded (its own ~370KB chunk, split out of the main bundle) so it never costs startup
  time for notes that don't use it — same pattern as the existing Excalidraw drawing block.
- **Editable nodes** — "+ Node" adds a node; double-click any node to rename it in place
  (small inline text input, not a native `prompt()`), Enter/blur commits, Escape cancels.
- **Connections** — drag from a node's edge (top/bottom/left/right handles) to another
  node to draw a connection between them; standard React Flow connect/pan/zoom/minimap.
- Resizable, themed to match the app (dark/light), same resize-handle affordance as the
  drawing and table blocks.

### Notes
- New dependency: `@xyflow/react` (the roadmap names React Flow explicitly for this
  phase). No other new dependencies.
- Node/edge state is serialized to the block's `data` attr (JSON) on an 800ms debounce,
  same shape as the drawing block's scene autosave; flushes immediately on unmount
  (switching notes) so a pending edit isn't lost, matching `Editor.tsx`'s own save-flush
  pattern.
- Fixed a node-id collision bug found during testing: rapid "+ Node" clicks landing in
  the same millisecond got the same `Date.now()`-based id, and React Flow silently drops
  nodes with duplicate ids — ids now include a random suffix. Also fixed newly-added
  nodes sometimes landing outside the visible viewport (`fitView` only auto-runs once on
  mount) by refitting the view after every node add.
- Added `.claude/skills/run-note24/` improvements from this version's testing: console-log
  capture (`logs` command), a real-mouse `drag`/`connect-nodes` command, and a documented
  gotcha that Electron's `backgroundThrottling` fully suspends timers for a window that
  never gets real OS focus under automation (the `launch` command now forces focus).

## 0.10.0 — Study System

### Added
- **Flashcards** — a new Study panel (topbar button, Ctrl+Shift+S) with a Flashcards tab:
  add/edit/delete cards by hand (front, back, category, plain-text or LaTeX answer), grouped
  by category, showing each card's next-due date.
- **Generate from Equations** — one click turns every equation in the library into a
  flashcard (front = name/description, back = its LaTeX, rendered live with KaTeX).
  Idempotent — re-running it only adds cards for equations that don't have one yet, so it's
  safe to hit again as the equation library grows.
- **Study mode** — a Study tab cycles through due cards (or all cards, if none are due) in
  random order, flips to reveal the answer on click, and grades each as "Got it" / "Missed
  it", showing a session summary at the end.
- **Spaced repetition** — every card carries its own interval index and next-due timestamp;
  a correct answer advances it along the 1 day → 3 days → 1 week → 2 weeks → 1 month ladder,
  a miss resets it to day 1. Pure scheduling logic lives in
  `src/renderer/src/lib/spacedRepetition.ts`.
- **Formula sheet** — a live, auto-updating Formula Sheet tab lists every equation in the
  library grouped by category with rendered LaTeX — always current since it just reads the
  equation library, with no separate document to keep in sync.

### Notes
- New `flashcards` table (migration 7): `source_slug` links a generated card back to its
  equation by stable slug (same rationale as `equation_relationships` — no SQL FK, since
  built-ins reseed on launch); a partial unique index on `source_slug` makes generation
  idempotent. `due_at`/`interval_idx` implement the whole spaced-repetition schedule in this
  one table — no separate review-log table.
- No PDF/print export for the formula sheet yet — `PrintLayer` is currently note-shaped only
  (renders `Note` documents); printing an equation-library view would need a second content
  path there. Left for a later pass; the on-screen sheet already covers the "auto-gathers all
  known formulas" requirement.
- Added `.claude/skills/run-note24/` — a Playwright `_electron` REPL driver for launching and
  clicking through the app during verification (this repo had no prior automated way to drive
  the UI beyond one-off throwaway scripts). Reused for this version's own testing.

## 0.9.0 — Citation Manager

### Added
- **Citation entries** — a new Citation Library panel (topbar button) for storing research
  sources of 5 types (Book, Paper, Website, Video, DOI source): title, authors, year,
  publisher/journal/site, URL, DOI.
- **4 citation formats** — APA, MLA, Chicago, IEEE — generated from the structured fields
  with a style switcher and one-click copy in the citation's detail view.
- **Attach a PDF to a citation** — reuses the existing attachment system as-is; the citation
  stores a normal (unlinked) attachment's id, so no schema change was needed there. Opens in
  the existing in-app PDF viewer.
- **Reference a citation in a note** — a new inline `citationRef` node (same shape as the
  existing wiki-link node) renders a short marker like "(Dirac et al., 1958)"; clicking it
  jumps to that citation's entry in the library.
- **Source relationships** — a citation's detail view lists every note that references it
  ("Used in"), kept in sync on every save via the same content-scan pattern already used for
  wiki-link backlinks.

### Notes
- No new dependency — citation formatting is a small set of pure functions
  (`src/renderer/src/lib/citationFormat.ts`), not a full CSL engine; handles the common case
  per style for each of the 5 source types rather than chasing exhaustive edge cases.
- `citations`/`citation_refs` are additive tables; `citation_refs.citation_id` has no SQL FK
  (cleaned up in code on citation delete), matching the `equation_relationships` precedent.

## 0.8.0 — Templates

### Added
- **4 built-in templates** — Problem Set, Lab Report, Research Notes, Lecture Notes — each
  with the sections from the roadmap as headings, seeded with real interactive blocks where
  it adds value: Problem Set gets an empty equation block and an empty Desmos graph; Lab
  Report gets an empty data table and an empty calculator block; Research Notes and Lecture
  Notes get bullet/numbered list placeholders. Static data, no DB table needed.
- **User templates** — "Save current note" in the template picker saves the open note's
  content as a reusable template (new `templates` table), with rename and delete.
- **One Template Picker** — a new "New from template" button next to "+ New note" in the
  sidebar opens a single modal listing both built-in and user templates side by side.

### Notes
- `NoteCreateInput` gained an optional `content` field so a template applies atomically at
  note creation, matching the note's plaintext into the FTS index immediately.
- **Incidental find during verification**: the live database had pre-existing corruption in
  the `attachments` table (unrelated to this version's code — confirmed read-only before any
  change), left over from repeated dev-build launch/kill cycles across recent sessions. It
  was recovered following the documented procedure (corrupted file preserved, not deleted;
  the one salvageable note was empty so nothing of value was lost). See
  `note24-build-gotchas` memory for the incident record.

## 0.7.1 — Optimization pass

### Changed
- **Installed size cut ~42% (634MB → ~365MB).** Renderer-only libraries (Excalidraw, pdf.js,
  TipTap, KaTeX, mathjs, nerdamer, lucide-react, zustand) moved from `dependencies` to
  `devDependencies` — Vite already bundles them into the app, so electron-builder was
  shipping every one of them a second time as loose `node_modules` files. Production
  `node_modules` now contains only better-sqlite3 (native) and the @electron-toolkit
  helpers (~13MB, down from ~200MB+).
- **electron-builder `files` is now an explicit allowlist** (`out/**`, `resources/**`) —
  previously the blocklist quietly shipped stray repo files (roadmap docs, run notes, etc.).
- **~10MB of dead mermaid/diagram chunks removed from every build.** Excalidraw lazily
  imports `@excalidraw/mermaid-to-excalidraw` for a text-to-diagram dialog Note24 never
  renders; it's now aliased to a tiny stub. Pasting mermaid-syntax text onto a drawing
  falls back to plain text (the same path a mermaid syntax error already took). Renderer
  build: 33MB → 27MB, and builds ~5s faster.
- **Notes list queries are no longer N+1.** `listNotes`/`searchNotes` fetched tags with one
  query per note on every refresh — and a refresh runs after every autosave. Now a single
  JOIN fetches all tags at once.
- **Attachment backfill runs once, not every launch.** The v0.6.0 embedded-image backfill
  re-scanned every note's JSON on each startup; it now records completion in settings and
  skips itself (new attachments are linked at creation time).

### Removed (internal duplication)
- The pointer-drag resize logic, copy-pasted in four block node views (calculator, Desmos,
  drawing, image), is now one shared helper (`lib/resizeDrag.ts`).
- The `data-*` TipTap attribute builders, duplicated or hand-rolled in seven extension
  files, are now shared (`extensions/nodeAttrs.ts`).

### Notes
- No behavior changes intended anywhere; existing notes, attachments, and settings are
  untouched. Verified against the real packaged build (launch, existing data, drawing,
  calculator, table, and the PDF viewer all exercised in `dist/win-unpacked/Note24.exe`).

## 0.7.0 — PDF Workspace

### Added
- **Embedded PDF viewer.** Clicking a PDF attachment anywhere (inline chip, File Manager,
  Note Attachments) now opens it in-app instead of shelling out to the OS's default viewer.
  Built on pdf.js (`pdfjs-dist`), lazy-loaded so it costs nothing until a PDF is opened.
  Includes page navigation, zoom, a lazily-rendered thumbnail sidebar, the PDF's own
  outline/bookmarks (when present), and full-document text search with page-jump results.
  An "Open externally" button keeps the old behavior available as a fallback.
- **Export to PDF.** A new "⤓ Export" action opens a checkbox tree over every note and
  folder in the vault — check individual notes or a whole folder (recursively) and export
  them as one combined PDF, with a table of contents when more than one note is selected.
  Uses Electron's built-in `printToPDF` (no new dependency for this half of the feature);
  notes render through the same TipTap editor used on screen, read-only, so equations,
  tables, calculator blocks, graphs, and drawings appear exactly as authored.
- **Print.** A "🖨 Print" action on the currently open note reuses the same print-layout
  renderer and opens the OS print dialog via `webContents.print`.

### Notes
- New dependency: `pdfjs-dist` (pinned to 5.x — the current 6.x release uses very recent
  JS syntax not yet supported by this Electron version's bundled Chromium; 5.x works
  correctly). Its worker script is bundled as a static asset under `src/renderer/public/pdf/`,
  same pattern as the Excalidraw font files.
- No PDF24 launcher (merge/compress/split/OCR shortcuts) in this version — deferred.

## 0.6.0 — Attachments System

### Added
- **Note & folder attachments.** Files can now be linked to a specific note or to a folder
  as a general resource, not just embedded inline in a note's body. `attachments` gained
  nullable `note_id`/`folder_id` columns (additive migration, no data loss); a one-time
  backfill links pre-existing embedded images to the note they're embedded in.
- **File Manager panel.** A new top-level panel (toolbar "📁 Files", `Ctrl+Shift+F`) listing
  every attachment vault-wide with search, a type icon, file size, its current note/folder
  link, and inline rename / move (reassign to any note or folder, or unlink) / delete / open.
- **Note attachments list.** A new "Attachments" section under every note's editor
  (alongside Backlinks) showing files attached to that note, with the same rename/open/delete
  actions and its own "+ Attach" button.
- **Drag-and-drop attach.** Dropping a real file onto a note or folder row in the sidebar
  attaches it to that note/folder directly — previously the sidebar only handled internal
  note/folder reordering, not OS file drops.
- **Broader file type support.** The attachment MIME map and native file picker now cover
  audio (mp3/wav/ogg/m4a/flac), video (mp4/webm/mov/avi), zip, and docx/doc, in addition to
  the existing images/pdf/txt/md/csv. Non-previewable types show a type-icon chip with
  "open externally" (in-app players are a later version's scope).
- **Cascade cleanup.** Deleting a note now deletes every attachment linked to it (file +
  DB row); deleting a folder deletes its own directly-attached files (including from any
  nested subfolders) without touching notes' own attachments — previously neither case
  cleaned up anything, permanently orphaning files on disk.

### Notes
- No SQL foreign keys on the new columns — cleanup happens in application code (same
  precedent as the equation-relationships tables), since a SQL cascade can delete a DB row
  but never the file on disk.
- Deleting an attachment removes it everywhere it's referenced, including any inline
  embedded copy in a note's body — this is called out in the delete confirmation text.

## 0.5.0 — Graphing & Data Analysis

### Added
- **Table block.** A new spreadsheet-style block (toolbar "▦") with editable header + data
  cells, add/remove row and column, and a horizontal-scrolling grid for wide datasets. Data
  is stored as JSON in the node's attrs, following the same pattern as calculator/equation
  blocks — no new DB schema.
- **Table → Graph.** A "Graph" button on the table block auto-detects the first two fully
  numeric columns and inserts a new Desmos graph directly below, pre-populated as a Desmos
  data table (points) using those columns.
- **Calculator → Graph.** A "Graph" button on the calculator block sends every line
  containing a variable (e.g. `y = x^2 - 4`) to a new Desmos graph as plotted expressions.
- **CSV / TSV import.** An "Import CSV" button on the table block opens a file picker,
  parses the file (handles quoted fields, commas or tabs, auto-detects the delimiter),
  and replaces the table's contents — with a confirmation if the table already has data.
- **Experimental data paste.** Pasting multi-cell tab/comma-delimited data (e.g. copied
  from Excel or instrument software) into any table cell fills the grid from that cell,
  auto-growing rows/columns as needed.
- **Desmos integration improvements.** Graphs can now be pre-seeded programmatically (table
  columns or a list of expressions) via a new `seed` attr on the Desmos node — the seed is
  applied once via the Desmos expression API, then the resulting graph state is saved and
  the seed cleared, so the graph persists and reloads normally afterward.

### Notes
- No new dependencies — CSV parsing and the table grid are hand-rolled to keep startup fast.
- No schema/migration changes; new node types default to empty/sample data when absent from
  older documents.

## 0.4.0 — Calculator & CAS

### Added
- **Engineering constants.** `g`, `G`, `c`, `h`, `R`, `k`, `mu0` (μ₀), and `epsilon0` (ε₀)
  are available in every calculator block — e.g. `F = 5 kg * g` → `49.03 N`. They reuse
  math.js's built-in physical constants (with correct units); assigning the same name in a
  block overrides the constant.
- **Variable inspector.** A collapsible "Variables" footer on each calculator block lists every
  defined variable with its current value and units.
- **Unit consistency checker.** Genuine dimensional mismatches (e.g. `5 m + 3 s`) now show a
  per-line "unit mismatch" warning instead of a silent blank line.
- **Rearrangement wizard.** A "Rearrange" panel solves an equation for any variable — type
  `P*V = n*R*T`, pick `V`, get `n*R*T/P` (via nerdamer), with an "Insert as line" button.

### Notes
- All changes are contained in the calculator block (engine + view); no schema or migration
  changes, so existing calculator blocks and notes are untouched.

## 0.3.0 — Equation Knowledge System (foundation)

### Added
- **Equation metadata collapse/expand.** Inserted library equations show only the
  formula by default; a details toggle reveals name, description, and variables, with
  a checkbox to hide them again and a pencil to edit. State is remembered per equation.
- **LaTeX-rendered variable symbols.** Variable symbols (e.g. `\omega`, `v_0`, `\Delta x`)
  now render as real math in both the note and the equation library, instead of plain text.
- **Stable equation identity.** Every equation has a durable `slug` — deterministic for
  built-ins, `custom-<id>` for user equations — so knowledge-graph data survives the
  built-in reseed that runs on every startup.
- **Equation relationships.** Link equations as *related*, *derives from*, or
  *special case of*, managed from a new details panel in the Equations library.
- **"Used In" references.** Each equation shows the equations that derive from it or
  generalize it (the reverse side of its relationships).
- **Derivation chains.** Store an ordered, LaTeX-rendered derivation for any equation.

### Changed
- Clicking a metadata-bearing equation now toggles its details; editing is via the pencil
  button. Bare equations (no metadata) still open straight to edit on click.

### Technical
- Migration #3 adds `equations.slug` (unique) plus slug-keyed `equation_relationships`
  and `equation_derivations` side tables — additive and backward-compatible; existing
  notes and equations are untouched.

## 0.2.0

### Added
- Confirm-to-delete dialogs for notes and folders (accurate folder-cascade wording).
- Rename notes directly from the sidebar (double-click).
- In-note equation metadata (name, description, variables) carried over and editable in place.
- Recolorable Lucide folder icons.
- Native spellcheck with right-click corrections and add-to-dictionary.
- Calculator block — live, unit-aware, lightly symbolic (math.js + nerdamer `solve`/`integrate`).

### Removed
- The note-wide Excalidraw annotate tool (drawing blocks remain).

## 0.1.0

Initial release: notes with a rich editor, nested customizable folders, switchable storage
locations, equation library with KaTeX, Desmos graphs, Excalidraw drawings, file attachments,
wiki-links with backlinks, a math symbol keyboard, and Windows packaging.
