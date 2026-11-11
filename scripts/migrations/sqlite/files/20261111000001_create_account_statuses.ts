import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20261111000001_create_account_statuses";
export const target: SqliteMigration["target"] = "sqlite1";

export const up = async (db: Database): Promise<void> => {
  // Universal account & entity statuses lookup table
  db.run(`
    CREATE TABLE IF NOT EXISTS account_statuses (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      badge_color TEXT NOT NULL DEFAULT 'emerald',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    INSERT OR IGNORE INTO account_statuses (code, label, badge_color, description) VALUES
      ('ACTIVE', 'Active', 'emerald', 'Normal active state with full access'),
      ('INACTIVE', 'Inactive', 'zinc', 'Temporarily inactive or deactivated'),
      ('SUSPENDED', 'Suspended', 'rose', 'Suspended by admin or billing policy'),
      ('PENDING', 'Pending', 'amber', 'Pending email verification or activation');
  `);

  // Migrate users table: add status column and backfill from is_active
  const tableInfo = db
    .query<{ name: string }, []>("PRAGMA table_info(users)")
    .all();
  const hasStatus = tableInfo.some((col) => col.name === "status");

  if (!hasStatus) {
    db.run(`
      ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE' REFERENCES account_statuses(code);
    `);
    const hasIsActive = tableInfo.some((col) => col.name === "is_active");
    if (hasIsActive) {
      db.run(`
        UPDATE users SET status = CASE WHEN is_active = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END;
      `);
    }
  }
};

export const down = async (db: Database): Promise<void> => {
  // SQLite 3.35.0+ supports DROP COLUMN
  try {
    db.run(`ALTER TABLE users DROP COLUMN status;`);
  } catch {
    // Ignore if older SQLite doesn't support DROP COLUMN
  }
  db.run(`DROP TABLE IF EXISTS account_statuses;`);
};
