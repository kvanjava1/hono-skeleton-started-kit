import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20260410080127_create_examples";
export const target: SqliteMigration["target"] = "sqlite1";

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
};

export const down = async (db: Database): Promise<void> => {
  db.run(`
    DROP TABLE IF EXISTS examples;
  `);
};
