import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20261112000007_add_client_status_history_and_fields";
export const target: SqliteMigration["target"] = "sqlite1";

export const up = async (db: Database): Promise<void> => {
  // 1. Add suspended_until and status_reason to clients table if not exists
  const tableInfo = db
    .query<{ name: string }, []>("PRAGMA table_info(clients)")
    .all();

  const hasSuspendedUntil = tableInfo.some((col) => col.name === "suspended_until");
  if (!hasSuspendedUntil) {
    db.run(`ALTER TABLE clients ADD COLUMN suspended_until TEXT DEFAULT NULL;`);
  }

  const hasStatusReason = tableInfo.some((col) => col.name === "status_reason");
  if (!hasStatusReason) {
    db.run(`ALTER TABLE clients ADD COLUMN status_reason TEXT DEFAULT NULL;`);
  }

  // 2. Create client_status_histories table for tracking audit trail
  db.run(`
    CREATE TABLE IF NOT EXISTS client_status_histories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      reason TEXT,
      suspended_until TEXT DEFAULT NULL,
      changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_client_status_histories_client_id 
    ON client_status_histories(client_id);
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS client_status_histories;`);
  try {
    db.run(`ALTER TABLE clients DROP COLUMN suspended_until;`);
    db.run(`ALTER TABLE clients DROP COLUMN status_reason;`);
  } catch {
    // Ignore if older SQLite doesn't support DROP COLUMN
  }
};
