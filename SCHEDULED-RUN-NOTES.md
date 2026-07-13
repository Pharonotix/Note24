# Scheduled Run Notes

Log of autonomous scheduled-task runs on Note24. Newest first.

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
