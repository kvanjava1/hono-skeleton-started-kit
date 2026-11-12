import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20261111000006_create_client_users_and_scope_permissions";
export const target: SqliteMigration["target"] = "sqlite1";

export const up = async (db: Database): Promise<void> => {
  // 1. Create client_users identity table
  db.run(`
    CREATE TABLE IF NOT EXISTS client_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE' REFERENCES account_statuses(code),
      is_active INTEGER NOT NULL DEFAULT 1,
      banned_until TEXT DEFAULT NULL,
      status_reason TEXT DEFAULT NULL,
      last_active_client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS client_users_email_unique
    ON client_users(email)
    WHERE deleted_at IS NULL;
  `);

  // 2. Add 'type' column to permissions table if it does not exist
  try {
    db.run(`ALTER TABLE permissions ADD COLUMN type TEXT NOT NULL DEFAULT 'admin';`);
  } catch (err) {
    // Column might already exist in test environments
  }
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP INDEX IF EXISTS client_users_email_unique;`);
  db.run(`DROP TABLE IF EXISTS client_users;`);
};
