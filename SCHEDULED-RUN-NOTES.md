# Scheduled Run Notes

Log of autonomous scheduled-task runs on Note24. Newest first.

## 2026-07-26 — v0.14.0 User Experience

**Completed:** v0.14.0 in full, fifth version of this session's v0.10–v0.20 sweep.

**Built:** Self-hosted editor fonts (`@fontsource/*` packages — Inter, Roboto,
Merriweather, JetBrains Mono, Caveat — no network fetch, no CSP changes needed) plus a
font-size slider (80–200%), both applied live via CSS custom properties
(`src/renderer/src/lib/editorPrefs.ts`). Reading Mode (wider read-only column, hides
toolbar/attachments/backlinks) and Focus Mode (hides sidebar+topbar, small persistent
exit button). Fully customizable global keyboard shortcuts
(`src/renderer/src/lib/shortcuts.ts` + a new Settings section) — click a binding,
press new keys, it saves; the whiteboard also got its own default shortcut
(Ctrl+Shift+W) which it never had before. Spellcheck and Themes already existed
(v0.2.0/v0.7.1) so no work was needed there.

**No new bugs found this round.**

**Verified:** `npm run typecheck` and `npm run build` pass. Real workflow testing via
the `run-note24` driver: changed the font to Caveat + 150% size in Settings and
confirmed it rendered correctly in the editor (visually distinct handwriting font at
larger size); toggled Reading Mode (toolbar/attachments hidden, wider column) and
Focus Mode (sidebar/topbar hidden, exit button present) and confirmed both visually;
rebound the "New note" shortcut from Ctrl+N to Ctrl+Shift+J via the Settings UI and
confirmed the change persisted correctly to the settings store.

**Left over / notes for next run:**
- Same deferred items as before (equation graph, equation→calculator, attachment
  audio/video players, PDF24 launcher, formula-sheet print export).
- Next version: v0.15.0 Productivity Workspace — continuing in this same session.

## 2026-07-26 — v0.13.0 Circuit Design

**Completed:** v0.13.0 in full, fourth version of this session's v0.10–v0.20 sweep.

**Built:** A schematic-diagram block reusing the Flowchart block's React Flow
foundation (v0.11.0) with a custom node type per component (resistor, capacitor,
inductor, IC, source, ground — hand-drawn SVG symbols, not an external symbol
library), a component palette, drag-to-wire connections, inline rename, and three
per-block export buttons (PNG/SVG/PDF) using two new lazy-loaded dependencies
(`html-to-image`, `jspdf`) plus a new generic `export.saveDataUrl` IPC channel that
writes any data: URL to a user-picked file.

**No new bugs found this round** — reusing the already-hardened Flowchart
block pattern (ref-based debounce+flush, random-suffixed node ids, `fitView` refresh
after adding a node) meant this version didn't hit the same class of issues v0.11/v0.12
did.

**Verified:** `npm run typecheck` and `npm run build` pass. Real workflow testing via
the `run-note24` driver: inserted a circuit block, added resistor/capacitor/ground
components (all render with correct schematic symbols and labels), clicked Export PNG
(no console errors through to the native save-dialog call — dialog itself can't be
driven by automation, which is expected), and confirmed a resistor component survives
a full app restart.

**Left over / notes for next run:**
- Did not automate the wire-drag-connect gesture (same known harness limitation
  documented in `.claude/skills/run-note24/SKILL.md` from v0.11.0) or the actual save-
  dialog file write (native OS dialog, can't be driven by CDP) — both use the identical,
  already-proven mechanics from the Flowchart block and PDF/print export respectively.
- Same deferred items as before (equation graph, equation→calculator, attachment
  audio/video players, PDF24 launcher, formula-sheet print export).
- Next version: v0.14.0 User Experience — continuing in this same session.

## 2026-07-26 — v0.12.0 Infinite Whiteboard

**Completed:** v0.12.0 in full, third version of this session's v0.10–v0.20 sweep.

**Built:** A full-screen "Whiteboard" mode (topbar button) — the existing Excalidraw
engine as an infinite freehand-drawing canvas, plus draggable overlay "cards" for Notes
(click → jump to note), Equations (live LaTeX), PDFs (click → open in-app viewer), and
Graphs (a real embedded, editable mini Desmos calculator, not just a static reference).
One shared board per vault, persisted as a single JSON blob under the existing
`settings` table — deliberately no new DB table/migration.

**Bugs found and fixed during testing (real bugs):**
- A React error #185 ("maximum update depth exceeded") crash that blanked the entire
  app whenever the whiteboard opened. Root cause: syncing Excalidraw's pan/zoom into
  this component's own React state on every single `onChange` event (which fires very
  rapidly) created a same-tick render cascade with Excalidraw's internal reflow.
  Diagnosed by bisecting — disabling Excalidraw entirely stopped the crash; re-enabling
  it but stubbing out just the `setTransform` state update also stopped it, isolating
  the exact cause. Fixed by keeping the drawn scene in a ref (never state — the
  debounced disk-save reads the ref directly, Excalidraw manages its own rendering) and
  coalescing the pan/zoom state sync to at most once per animation frame via
  `requestAnimationFrame` instead of once per `onChange` call.
- A separate, unrelated bug found in the same session: overlay cards rendered with
  correct DOM position and content but were invisible, painted underneath Excalidraw's
  own canvas — needed an explicit `z-index` on the overlay layer.

**Verified:** `npm run typecheck` and `npm run build` pass. Real workflow testing via
the `run-note24` driver: opened the whiteboard, added a live graph card and a note-
reference card (both correctly visible after the z-index fix), closed and reopened the
whiteboard within the same session, then did a full app restart and confirmed the graph
card (and its position) survived.

**Left over / notes for next run:**
- Did not exhaustively test PDF/Equation card creation or freehand drawing + card
  dragging in this pass — they share the identical picker/addCard code path already
  verified for Note/Graph cards, so confidence is high, but a future run could spot-
  check them if whiteboard bugs come up.
- Same deferred items as before (equation graph, equation→calculator, attachment
  audio/video players, PDF24 launcher, formula-sheet print export).
- Next version: v0.13.0 Circuit Design — continuing in this same session.

## 2026-07-26 — v0.11.0 Flowcharts

**Completed:** v0.11.0 in full, second version of this session's full v0.10–v0.20 sweep.

**Built:** A React-Flow-backed (`@xyflow/react`, new dependency) flowchart/mind-map/
dependency-map block — `FlowchartCanvas.tsx` (lazy-loaded canvas + editable-label custom
node type), `FlowchartNode.ts`/`FlowchartView.tsx`/`Flowchart.module.css` (TipTap block,
same 3-file pattern as the Drawing block), registered in `contentExtensions.ts` and the
toolbar. "+ Node" adds nodes, double-click renames in place, drag between handles
connects nodes, block is resizable and reskinned to the app theme.

**Bugs found and fixed during testing (real bugs, not testing artifacts):**
- Node-id collisions: `Date.now()`-only ids could collide on rapid clicks, silently
  dropping nodes (React Flow de-dupes by id) — fixed with a random suffix.
- New nodes could land outside the visible viewport since React Flow's `fitView` prop
  only runs once on mount — fixed by calling `fitView()` again after every node add.

**Testing-harness findings (not app bugs, but cost significant time to diagnose — see
`.claude/skills/run-note24/SKILL.md` Gotchas for the durable record):**
- Electron's `backgroundThrottling` (default on) fully *suspends* (not just throttles)
  timers for a BrowserWindow that never receives real OS focus under automation — this
  made the flowchart's 800ms save-debounce appear completely broken (confirmed via a
  heartbeat `setInterval` that never ticked for 8+ seconds) until `launch` was changed to
  force `page.bringToFront()` + `BrowserWindow.focus()`. Even then, a timer registered by
  one `page.evaluate()`/input-dispatch call and awaited by a *separate* later call still
  never fired — only combining the triggering action and the wait inside one evaluate()
  call reliably let pending timers run. This means any future debounced-save testing
  should use that combined-call pattern, not separate click-then-wait commands.
- Drag-to-connect (React Flow's handle-to-handle connection gesture) could not be
  reliably automated via either real Playwright mouse events or synthetic PointerEvents,
  precise handle targeting notwithstanding — almost certainly because such libraries rely
  on real `setPointerCapture()`, which requires trusted, hardware-originated pointer
  sequences. Verified the underlying data path instead: manually wrote a note containing
  a flowchart node with a pre-built edge via `window.api.notes.update`, reloaded, and
  confirmed the edge rendered correctly — proving the save/load round-trip works even
  though the interactive drag gesture itself couldn't be automated end-to-end.

**Verified:** `npm run typecheck` and `npm run build` pass. Real workflow testing via the
(now more capable) `run-note24` driver: inserted a flowchart, added multiple distinct
nodes (post-fix), renamed a node in place with the change persisting to the note content
and surviving a full app restart, and confirmed a pre-built node+edge graph loads and
renders correctly.

**Left over / notes for next run:**
- Same deferred items as before (equation graph, equation→calculator, attachment
  audio/video players, PDF24 launcher, formula-sheet print export).
- Next version: v0.12.0 Infinite Whiteboard — continuing in this same session.

## 2026-07-26 — v0.10.0 Study System

**Completed:** v0.10.0 in full (tree was clean at start — jumped straight from v0.9.0 to
implementing this version). Session is doing a full sweep through v0.10.0–v0.20.0 per an
explicit user request (not the normal one-version-per-run cadence); this is the first of
that run.

**Built:**
- `flashcards` table (migration 7 in `src/main/db/migrations.ts`) + repo module
  (`src/main/db/flashcards.ts`): manual CRUD, `reviewFlashcard` (spaced-repetition
  scheduling), and `generateFlashcardsFromEquations` (idempotent — skips equations that
  already have a card, keyed by stable equation `slug`).
- `src/renderer/src/lib/spacedRepetition.ts`: pure interval-ladder helper (1/3/7/14/30
  days), mirrored server-side in the repo module so main and renderer agree on scheduling.
- New Study panel (`src/renderer/src/components/StudyPanel/`) with three tabs: Flashcards
  (add/edit/delete, grouped by category, due-date badges), Study (flip-card session with
  Got it/Missed it grading), Formula Sheet (live, auto-grouped-by-category view of every
  equation in the library, rendered with KaTeX).
- Wired into the app shell the same way as Equations/Citations/File Manager: topbar
  button, mutual-exclusion panel state in the store, Ctrl+Shift+S keybinding.
- Full IPC plumbing (types → ipc channels → api surface → main handlers → preload bridge)
  following the existing citations/templates pattern exactly.

**Verified:**
- `npm run typecheck` and `npm run build` — both pass.
- Built a durable UI driver this run: `.claude/skills/run-note24/` (Playwright
  `_electron` REPL, committed — not a throwaway script like the v0.5.0 run used). Fixed
  three real bugs in the driver itself before it worked reliably: piped-stdin commands
  racing ahead of async handlers (needed a serialized promise queue), `process.exit()`
  dropping buffered stdout on Windows (needed `stdout._handle.setBlocking(true)`), and
  `rl.close()` firing before the queue drained (needed to await the queue in the `close`
  handler). Since this session covers 11 versions, this driver will be reused for all of
  them instead of rebuilding it each time.
- Real workflow testing via the driver: opened the Study panel, clicked "Generate from
  Equations" → created 104 cards from the built-in equation library (confirmed correct
  count, grouped by category, all "Due now"); re-clicked it → correctly reported "already
  up to date, no new equations" (idempotency confirmed); ran a Study session → flipped a
  card to its KaTeX-rendered answer, graded "Got it" → due-count badge dropped from 104
  to 103 and advanced to the next card (spaced-repetition scheduling confirmed); opened
  Formula Sheet tab → all equations rendered grouped by category with correct LaTeX.
  Screenshots taken and reviewed at each step, then cleaned up (not committed).

**Left over / notes for next run:**
- Formula sheet has no PDF/print export yet — `PrintLayer` only knows how to render
  `Note` documents; adding an equation-library content path there is deferred (noted in
  CHANGELOG and roadmap).
- Deferred (unchanged from prior runs): visual equation dependency graph (v0.3.0),
  equation→calculator integration (v0.4.0), in-app audio/video players (v0.6.0), PDF24
  launcher (v0.7.0).
- Next version: v0.11.0 Flowcharts (React Flow) — continuing in this same session.

## 2026-07-12 — v0.5.0 Graphing & Data Analysis

**Completed:** v0.5.0 in full (tree was clean at start, so this run implemented the whole
version rather than finishing carry-over work).

**Built:**
- Table block (`DataTableNode.ts` / `DataTableView.tsx` / `DataTable.module.css`): editable
  grid, add/remove row/column, horizontal scroll for wide tables.
- CSV/TSV import via a hidden file input + hand-rolled quoted-field parser (`lib/csv.ts`);
  confirms before overwriting existing table content.
- Paste-to-fill: pasting multi-cell delimited text into any cell fills the grid from that
  cell, auto-growing rows/columns (covers "experimental data import" from pasted
  spreadsheet/instrument data).
- Table → Graph: auto-detects the first two fully-numeric columns (`lib/tableData.ts`),
  inserts a new Desmos graph node seeded with those columns as a Desmos data table.
- Calculator → Graph: sends calculator lines containing a variable to a new Desmos graph as
  plotted expressions.
- Desmos integration improvement: added a `seed` attr to the Desmos node + `applyDesmosSeed`
  helper in `lib/desmos.ts` — seed is applied once via `calc.setExpression`, then the
  resulting state is saved and the seed cleared, so seeded graphs behave like any other
  graph on reload.

**Verified:**
- `npm run typecheck` and `npm run build` — both pass.
- Real workflow testing via a temporary Playwright `_electron` driver script (not part of
  the app; `playwright-core` was installed with `--no-save` and left in `node_modules` only,
  same pattern as the one-off icon-gen tools — package.json/lock untouched):
  - Inserted a table, typed a 3-row x,y dataset, clicked Graph → correct Desmos scatter
    plot appeared with the right points.
  - Reloaded the app and reopened the note → table and graph both persisted correctly
    (confirmed visually via screenshot; an automated `[data-desmos]` selector check in the
    driver script was a false negative — that attr is only set by TipTap's HTML
    serialization path, not the live React NodeView DOM — the screenshot is the ground
    truth and showed the full graph rendered).
  - Inserted a calculator block, typed `y = x^2 - 4`, clicked Graph → correct parabola
    plotted on a new Desmos graph.
  - Pasted a 3-column x 4-row tab-delimited block into a table cell → grid correctly grew
    and filled from that cell.
- No project skill existed yet for driving the Electron app; built a throwaway driver this
  run rather than a permanent `.claude/skills/run-*` skill (out of scope for a single
  feature version) — a future run could invoke `/run-skill-generator` to make this durable
  if UI verification keeps coming up.

**Left over / notes for next run:**
- The verification session created several throwaway "Untitled" test notes in the real dev
  vault (`%APPDATA%\note24\note24.db`) while exercising the UI. They were left in place
  rather than risk deleting anything — per the "existing data is sacred" rule, only newly
  *added* test rows exist, nothing was modified or removed. Aiden may want to delete them
  manually from the sidebar.
- Deferred (per the roadmap's own notes, unchanged from prior runs): the visual equation
  dependency graph (from v0.3.0) and equation→calculator integration (from v0.4.0).
- Next version per roadmap: v0.6.0 Attachments System.
