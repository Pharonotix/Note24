# Scheduled Run Notes

Log of autonomous scheduled-task runs on Note24. Newest first.

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
