import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20261112000008_create_activity_logs";
export const target: SqliteMigration["target"] = "sqlite1";

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      actor_id INTEGER,
      actor_type TEXT NOT NULL DEFAULT 'client_user',
      actor_name TEXT,
      actor_email TEXT,
      action TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'organization',
      description TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_client_id 
    ON activity_logs(client_id, created_at);
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_actor 
    ON activity_logs(actor_type, actor_id, created_at);
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_scope 
    ON activity_logs(scope, created_at);
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at 
    ON activity_logs(created_at);
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS activity_logs;`);
};
