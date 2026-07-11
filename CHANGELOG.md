# Changelog

All notable changes to Note24. Newest first.

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
