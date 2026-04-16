import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20260415170000_prepare_examples_crud";
export const target: SqliteMigration["target"] = "sqlite1";

const getExistingColumns = (db: Database): string[] => {
  const rows = db
    .query<{ name: string }, []>("PRAGMA table_info(examples)")
    .all();

  return rows.map((row) => row.name);
};

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const columns = getExistingColumns(db);

  if (!columns.includes("deleted_at")) {
    db.run(`ALTER TABLE examples ADD COLUMN deleted_at TEXT`);
  }

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_examples_email_active
    ON examples (email);
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_examples_full_name_active
    ON examples (full_name);
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP INDEX IF EXISTS idx_examples_email_active;`);
  db.run(`DROP INDEX IF EXISTS idx_examples_full_name_active;`);

  db.run(`
    CREATE TABLE IF NOT EXISTS examples_backup (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    INSERT INTO examples_backup (
      id,
      full_name,
      email,
      password,
      created_at,
      updated_at
    )
    SELECT
      id,
      full_name,
      email,
      password,
      created_at,
      updated_at
    FROM examples;
  `);

  db.run(`DROP TABLE examples;`);
  db.run(`ALTER TABLE examples_backup RENAME TO examples;`);
};
