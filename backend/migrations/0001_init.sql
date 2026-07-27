-- 黒丸表システム: retailers table.
--
-- Design note: stores / categories / products / sheets / templates are kept
-- as a single JSON document per retailer (the `data_json` column), mirroring
-- the original prototype's in-memory data shape 1:1. This was a deliberate
-- simplification: the app's business logic (grid <-> unit <-> shelf-count
-- mapping, CSV generation, template save/restore) is all document-shaped and
-- always operates on "one retailer's whole dataset" at a time, so there is
-- no cross-retailer relational querying need. If a future requirement needs
-- SQL-level querying across retailers (reporting, etc.), normalize
-- stores/products/categories/sheets into their own tables at that point.
CREATE TABLE retailers (
  id            TEXT PRIMARY KEY,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  name          TEXT NOT NULL,
  toknm         TEXT NOT NULL DEFAULT '',
  dept          TEXT NOT NULL DEFAULT '',
  mkcd          TEXT NOT NULL DEFAULT '999',
  zip           TEXT NOT NULL DEFAULT '',
  tel           TEXT NOT NULL DEFAULT '',
  fax           TEXT NOT NULL DEFAULT '',
  addr          TEXT NOT NULL DEFAULT '',
  ship_json     TEXT NOT NULL DEFAULT '{"datc":"2","denymd":"","gyono":"1","tokcd":"","event":"販促POP","mknm":""}',
  csv_cols_json TEXT NOT NULL DEFAULT '[]',
  data_json     TEXT NOT NULL DEFAULT '{"masters":{"stores":[],"categories":[],"products":[]},"sheets":[],"templates":[]}',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_retailers_sort_order ON retailers(sort_order);
