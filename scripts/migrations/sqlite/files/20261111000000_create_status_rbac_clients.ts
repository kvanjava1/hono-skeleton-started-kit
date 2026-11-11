import type { SqliteMigration } from "../runner.ts";
import type { Database } from "bun:sqlite";

export const name = "20261111000000_create_status_rbac_clients";
export const target: SqliteMigration["target"] = "sqlite1";

export const up = async (db: Database): Promise<void> => {
  // 1. Universal account & entity statuses lookup table
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

  // 2. Migrate users table: add status column and backfill from is_active
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

  // 3. RBAC: Roles table
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'admin',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 4. RBAC: Atomic permissions catalog
  db.run(`
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      "group" TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 5. RBAC: Role-to-Permissions pivot
  db.run(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );
  `);

  // 6. RBAC: User-to-Roles pivot (Admin backoffice)
  db.run(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );
  `);

  // 7. Clients (Organizations subscribing to API)
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE' REFERENCES account_statuses(code),
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 8. Client Members (Team membership linking user to client with a role)
  db.run(`
    CREATE TABLE IF NOT EXISTS client_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'ACTIVE' REFERENCES account_statuses(code),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS client_members_client_user_unique
    ON client_members(client_id, user_id);
  `);

  // 9. Client Invitations
  db.run(`
    CREATE TABLE IF NOT EXISTS client_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 10. API Keys
  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      secret_hash TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE' REFERENCES account_statuses(code),
      last_used_at TEXT DEFAULT NULL,
      expires_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 11. API Key Permissions (Scopes)
  db.run(`
    CREATE TABLE IF NOT EXISTS api_key_permissions (
      api_key_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (api_key_id, permission_id)
    );
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS api_key_permissions;`);
  db.run(`DROP TABLE IF EXISTS api_keys;`);
  db.run(`DROP TABLE IF EXISTS client_invitations;`);
  db.run(`DROP INDEX IF EXISTS client_members_client_user_unique;`);
  db.run(`DROP TABLE IF EXISTS client_members;`);
  db.run(`DROP TABLE IF EXISTS clients;`);
  db.run(`DROP TABLE IF EXISTS user_roles;`);
  db.run(`DROP TABLE IF EXISTS role_permissions;`);
  db.run(`DROP TABLE IF EXISTS permissions;`);
  db.run(`DROP TABLE IF EXISTS roles;`);
  db.run(`DROP TABLE IF EXISTS account_statuses;`);
};
