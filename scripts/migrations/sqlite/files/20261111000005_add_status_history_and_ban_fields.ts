import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20261111000005_add_status_history_and_ban_fields";
export const target: SqliteMigration["target"] = "sqlite1";

export const up = async (db: Database): Promise<void> => {
  // 1. Add BANNED status to account_statuses lookup dictionary
  db.run(`
    INSERT OR IGNORE INTO account_statuses (code, label, badge_color, description) VALUES
      ('BANNED', 'Banned', 'rose', 'Account banned or suspended with penalty');
  `);

  // 2. Add banned_until and status_reason to users table if not exists
  const tableInfo = db
    .query<{ name: string }, []>("PRAGMA table_info(users)")
    .all();

  const hasBannedUntil = tableInfo.some((col) => col.name === "banned_until");
  if (!hasBannedUntil) {
    db.run(`ALTER TABLE users ADD COLUMN banned_until TEXT DEFAULT NULL;`);
  }

  const hasStatusReason = tableInfo.some((col) => col.name === "status_reason");
  if (!hasStatusReason) {
    db.run(`ALTER TABLE users ADD COLUMN status_reason TEXT DEFAULT NULL;`);
  }

  // 3. Create user_status_histories table for tracking audit trail
  db.run(`
    CREATE TABLE IF NOT EXISTS user_status_histories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      reason TEXT,
      banned_until TEXT DEFAULT NULL,
      changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_user_status_histories_user_id 
    ON user_status_histories(user_id);
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS user_status_histories;`);
  try {
    db.run(`ALTER TABLE users DROP COLUMN banned_until;`);
    db.run(`ALTER TABLE users DROP COLUMN status_reason;`);
  } catch {
    // Ignore if older SQLite doesn't support DROP COLUMN
  }
};
