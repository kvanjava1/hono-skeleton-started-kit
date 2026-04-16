# API Patterns

This document describes the common pattern for adding a new API module in this skeleton.

## Creating a New Module

Recommended flow:

1. Migration
2. Schema
3. Repository
4. Service
5. Controller
6. Route registration
7. Optional: Job

Why this order:

- migration defines storage first
- schema defines expected input/output
- repository depends on clear table or collection shape
- service depends on repository
- controller depends on service
- route is the final wiring point
- job is optional and only used for background work

## 1. Migration

Use migrations to create or change database structure.

Generate:

```bash
bun run make migration sqlite create_payments
```

Example:

```ts
import type { SqliteMigration } from '../runner.ts';
import type { Database } from 'bun:sqlite';

export const name = '20260410_create_payments';
export const target: SqliteMigration['target'] = 'sqlite1';

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS payments;`);
};
```

Notes:

- SQLite migrations must declare `target`
- MySQL, MongoDB, and PostgreSQL multi-connection migrations should also declare `target`

## 2. Schema

Schema is used for request validation and inferred types.

Generate:

```bash
bun run make schema Payment
```

Example:

```ts
import { z } from 'zod';

export const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  orderId: z.string().min(1),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
```

## 3. Repository

Repositories handle data access only.

Generate:

```bash
bun run make repository sqlite Payment
```

Rules:

- choose the database connection explicitly
- keep HTTP and request validation out of repositories
- keep business rules out of repositories

Examples of explicit targeting:

- `getSqliteDb('sqlite1')`
- `getMysqlPool('mysql1')`
- `getMongoDb('mongo1')`
- `getPgSql('pg1')`

## 4. Service

Services contain business logic.

Typical service responsibilities:

- extra validation beyond schema
- orchestration across repositories
- cache integration
- throwing `AppError` subclasses

Rules:

- do not access Hono `Context`
- do not shape HTTP JSON responses
- throw errors instead of returning hidden error payloads

## 5. Controller

Controllers are HTTP boundaries.

Responsibilities:

- read params from request
- read validated input
- call service
- return `successResponse()`

Rules:

- do not query the database directly
- do not put large business logic in controllers
- do not use `try/catch` for expected application errors handled globally

## 6. Route Registration

Routes are the final wiring point.

Current skeleton does not ship route generators, so route files are written manually in `src/routes/`.
