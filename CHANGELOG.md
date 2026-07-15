# Changelog

All notable changes to Note24. Newest first.

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
