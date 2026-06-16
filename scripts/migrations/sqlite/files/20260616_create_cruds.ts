import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20260616_create_cruds";
export const target: SqliteMigration["target"] = "sqlite1";

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cruds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT DEFAULT NULL
    );
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS cruds;`);
};
