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
  `
]
