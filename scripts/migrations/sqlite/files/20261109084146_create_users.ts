import type { SqliteMigration } from '../runner.ts';
import type { Database } from 'bun:sqlite';

export const name = '20261109084146_create_users';
export const target: SqliteMigration['target'] = 'sqlite1';

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Partial unique index: email must be unique among active rows only, so a
  // soft-deleted user's email can be reused by a new account (plan D6).
  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
    ON users(email)
    WHERE deleted_at IS NULL;
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP INDEX IF EXISTS users_email_unique;`);
  db.run(`DROP TABLE IF EXISTS users;`);
};
