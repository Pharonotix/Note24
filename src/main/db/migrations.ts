/**
 * Ordered schema migrations. Each entry is applied once, in order, tracked by
 * SQLite's `user_version` pragma. Append new migrations; never edit past ones.
 *
 * The full v1 schema (including tables used by later phases — equations, links,
 * attachments) is defined up front so later phases don't need new migrations.
 */
export const migrations: string[] = [
  /* --- 1: initial schema --- */
  `
  CREATE TABLE folders (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE
  );

  CREATE TABLE notes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL DEFAULT 'Untitled',
    content     TEXT NOT NULL DEFAULT '',   -- ProseMirror document (JSON)
    annotations TEXT,                        -- note-wide Excalidraw scene (JSON) or NULL
    folder_id   INTEGER REFERENCES folders(id) ON DELETE SET NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  CREATE INDEX idx_notes_folder ON notes(folder_id);
  CREATE INDEX idx_notes_updated ON notes(updated_at DESC);

  CREATE TABLE tags (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE note_tags (
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id  INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
  );

  CREATE TABLE links (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    source_note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    target_note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL,
    target_title   TEXT NOT NULL
  );
  CREATE INDEX idx_links_source ON links(source_note_id);
  CREATE INDEX idx_links_target ON links(target_note_id);
  CREATE INDEX idx_links_target_title ON links(target_title);

  CREATE TABLE equations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    latex          TEXT NOT NULL,
    description    TEXT NOT NULL DEFAULT '',
    category       TEXT NOT NULL DEFAULT '',
    variables_json TEXT NOT NULL DEFAULT '[]',
    tags           TEXT NOT NULL DEFAULT '',
    is_builtin     INTEGER NOT NULL DEFAULT 0,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
  );
  CREATE INDEX idx_equations_category ON equations(category);

  CREATE TABLE attachments (
    id         TEXT PRIMARY KEY,     -- uuid, also the on-disk filename stem
    filename   TEXT NOT NULL,
    mime       TEXT NOT NULL,
    size       INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Full-text index over notes; rowid is kept equal to notes.id, synced in code.
  CREATE VIRTUAL TABLE notes_fts USING fts5(title, body);
  `,

  /* --- 2: folder customization + manual ordering --- */
  `
  ALTER TABLE folders ADD COLUMN color TEXT;
  ALTER TABLE folders ADD COLUMN icon TEXT;
  ALTER TABLE folders ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE notes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  `,

  /* --- 3: equation knowledge system (stable slug identity + relationships + derivations) ---
     Built-in equations are re-inserted on every startup (their autoincrement ids are NOT
     stable), so relationships/derivations are keyed on a stable `slug` instead — built-ins
     get a deterministic slug from the seed; customs get `custom-<id>`. Relationship and
     derivation rows are slug-keyed side tables, decoupled from the equations reseed, and
     carry no SQL foreign keys (slug references are cleaned up in code on delete). */
  `
  ALTER TABLE equations ADD COLUMN slug TEXT;
  CREATE UNIQUE INDEX idx_equations_slug ON equations(slug) WHERE slug IS NOT NULL;
  UPDATE equations SET slug = 'custom-' || id WHERE slug IS NULL AND is_builtin = 0;

  CREATE TABLE equation_relationships (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    from_slug TEXT NOT NULL,
    to_slug   TEXT NOT NULL,
    kind      TEXT NOT NULL DEFAULT 'related',
    UNIQUE(from_slug, to_slug, kind)
  );
  CREATE INDEX idx_eqrel_from ON equation_relationships(from_slug);
  CREATE INDEX idx_eqrel_to ON equation_relationships(to_slug);

  CREATE TABLE equation_derivations (
    slug       TEXT PRIMARY KEY,
    steps_json TEXT NOT NULL DEFAULT '[]'
  );
  `,

  /* --- 4: attachments system (note/folder linkage) ---
     No SQL foreign keys, same rationale as equation_relationships: cleanup on
     note/folder delete is done in code (main/attachments.ts), which also has to
     remove the on-disk file — something a SQL cascade could never do anyway. */
  `
  ALTER TABLE attachments ADD COLUMN note_id INTEGER;
  ALTER TABLE attachments ADD COLUMN folder_id INTEGER;
  CREATE INDEX idx_attachments_note ON attachments(note_id);
  CREATE INDEX idx_attachments_folder ON attachments(folder_id);
  `,

  /* --- 5: user templates ---
     Built-in templates (Problem Set, Lab Report, Research Notes, Lecture Notes) are
     static data in the renderer (src/renderer/src/lib/builtinTemplates.ts) — fixed,
     never edited, so they don't need a DB row. Only user-saved templates persist here. */
  `
  CREATE TABLE templates (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  `,

  /* --- 6: citation manager ---
     `attachment_id` links to the existing attachments table by its uuid — no SQL FK
     (attachments predate this table and already use app-level cleanup everywhere), so
     an attached PDF's own lifecycle stays independent of the citation. `citation_refs`
     mirrors `links`: source_note_id cascades with the note (real FK, like links.ts),
     citation_id does not (cleaned up in code on citation delete, like equation_relationships). */
  `
  CREATE TABLE citations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT NOT NULL DEFAULT 'book',
    title         TEXT NOT NULL DEFAULT '',
    authors       TEXT NOT NULL DEFAULT '',
    year          TEXT NOT NULL DEFAULT '',
    publisher     TEXT NOT NULL DEFAULT '',
    url           TEXT NOT NULL DEFAULT '',
    doi           TEXT NOT NULL DEFAULT '',
    attachment_id TEXT,
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );
  CREATE INDEX idx_citations_type ON citations(type);

  CREATE TABLE citation_refs (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    source_note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    citation_id    INTEGER NOT NULL,
    UNIQUE(source_note_id, citation_id)
  );
  CREATE INDEX idx_citation_refs_citation ON citation_refs(citation_id);
  `,

  /* --- 7: study system (flashcards + spaced repetition) ---
     `source_slug` links a generated card back to the equation it was made from (stable
     slug, same rationale as equation_relationships — no SQL FK since built-ins reseed);
     it is NULL for manually-authored cards. The unique partial index makes "generate
     from equations" idempotent — re-running it only inserts cards for equations that
     don't have one yet. `due_at`/`interval_idx` implement spaced repetition entirely in
     this table; no separate review-log table is needed since only the next due date
     (not full history) drives scheduling. */
  `
  CREATE TABLE flashcards (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    front            TEXT NOT NULL,
    back             TEXT NOT NULL,
    back_format      TEXT NOT NULL DEFAULT 'text',
    category         TEXT NOT NULL DEFAULT '',
    source_slug      TEXT,
    interval_idx     INTEGER NOT NULL DEFAULT 0,
    due_at           INTEGER NOT NULL,
    last_reviewed_at INTEGER,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
  );
  CREATE INDEX idx_flashcards_due ON flashcards(due_at);
  CREATE UNIQUE INDEX idx_flashcards_source ON flashcards(source_slug) WHERE source_slug IS NOT NULL;
  `,

  /* --- 8: productivity workspace (pinned notes) --- */
  `
  ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
  CREATE INDEX idx_notes_pinned ON notes(pinned);
  `,

  /* --- 9: data protection (per-note version history) ---
     A version is snapshotted when a note is switched away from (not on every
     debounced autosave — that would be one row per keystroke), and skipped if the
     content is unchanged since the last snapshot. No SQL FK on note_id: versions of a
     deleted note are cleaned up in code (like attachments/citation_refs), since a
     cascade would silently lose history the moment someone deletes a note by mistake
     and undoes it via restore — better to let deleteNote() decide explicitly. */
  `
  CREATE TABLE note_versions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    note_id    INTEGER NOT NULL,
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_note_versions_note ON note_versions(note_id, created_at DESC);
  `
]
