# Migrations

This project supports migrations for:

- MySQL
- MongoDB
- PostgreSQL
- SQLite

## Directory Structure

```text
scripts/migrations/
├── mysql/files/
├── mongo/files/
├── pg/files/
└── sqlite/files/
```

## Commands

Run all enabled migrations:

```bash
bun run migrate:dev
bun run migrate:prod
```

Run a specific target:

```bash
bun run migrate:dev mysql
bun run migrate:dev mongo
bun run migrate:dev pg
bun run migrate:dev sqlite
```

Run a specific file:

```bash
bun run migrate:dev sqlite 20260410080127_create_users
```

Rollback:

```bash
bun run --env-file=.env.dev scripts/migrate.ts rollback
bun run --env-file=.env.dev scripts/migrate.ts rollback sqlite
```

Create a migration file:

```bash
bun run make migration sqlite create_users
```

## Target-Aware Migration Engines

These migration engines require explicit `target`:

- SQLite
- MySQL
- MongoDB
- PostgreSQL

### MySQL

```ts
import type { MySqlMigration } from '../runner.ts';
import type { Pool } from 'mysql2/promise';

export const name = '20260410_create_users';
export const target: MySqlMigration['target'] = 'mysql1';

export const up = async (pool: Pool): Promise<void> => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE
    )
  `);
};

export const down = async (pool: Pool): Promise<void> => {
  await pool.execute(`DROP TABLE IF EXISTS users`);
};
```

Valid targets:

- `mysql1`
- `mysql2`

### MongoDB

```ts
import type { MongoMigration } from '../runner.ts';
import type { Db } from 'mongodb';

export const name = '20260410_create_users';
export const target: MongoMigration['target'] = 'mongo1';

export const up = async (db: Db): Promise<void> => {
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
};

export const down = async (db: Db): Promise<void> => {
  await db.collection('users').dropIndex('email_1');
};
```

Valid targets:

- `mongo1`
- `mongo2`

### PostgreSQL

```ts
import type { PgMigration } from '../runner.ts';
import type postgres from 'postgres';

export const name = '20260410_create_users';
export const target: PgMigration['target'] = 'pg1';

export const up = async (sql: postgres.Sql): Promise<void> => {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE
    )
  `;
};

export const down = async (sql: postgres.Sql): Promise<void> => {
  await sql`DROP TABLE IF EXISTS users`;
};
```

Valid targets:

- `pg1`
- `pg2`

### SQLite

```ts
import type { SqliteMigration } from '../runner.ts';
import type { Database } from 'bun:sqlite';

export const name = '20260410_create_users';
export const target: SqliteMigration['target'] = 'sqlite1';

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE
    );
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS users;`);
};
```

Valid targets:

- `sqlite1`

## Best Practices

1. Always implement `down()`.
2. Do not change schema manually outside migrations.
3. Treat `target` as mandatory for target-aware engines.

[Back to Docs](../README.md)
