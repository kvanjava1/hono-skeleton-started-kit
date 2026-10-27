# Multi-Database Connection Model

This skeleton is architected for microservices and applications that require connections to multiple databases (e.g., multi-tenant setups, read/write replicas, or polyglot persistence) simultaneously.

---

## 🎯 Named Connections

Every database engine is accessed through an explicit name identifier:

| Engine | Default Identifier | Helper Getter | ORM Wrapper / Driver |
|---|---|---|---|
| **SQLite** | `sqlite1` | `getSqliteDb('sqlite1')` | Drizzle ORM: `getDrizzleSqliteDb('sqlite1')` (or `getDrizzleDb`) |
| **MySQL** | `mysql1` | `getMysqlPool('mysql1')` | Drizzle ORM: `getDrizzleMysqlDb('mysql1')` or `mysql2/promise` Pool |
| **PostgreSQL**| `pg1` | `getPgSql('pg1')` | Drizzle ORM: `getDrizzlePgDb('pg1')` or `postgres` driver |
| **MongoDB** | `mongo1` | `getMongoDb('mongo1')` | Native `mongodb` Driver (`Db` instance) |
| **Redis** | `redis1` | `getRedis('redis1')` | `ioredis` Client |

---

## 🛡️ Compatibility Fallbacks

For backward compatibility, getter helpers fallback to default connections when called without arguments:

```ts
// Both resolve to the same underlying connection:
const mysqlPool = getMysqlPool();                 // Fallback default: 'mysql1'
const mysqlPoolExplicit = getMysqlPool('mysql1'); // Recommended practice
```

> [!NOTE]
> For all new modules and repository methods, **always specify the connection name explicitly** to ensure clear targeting and avoid ambiguity if additional connections (e.g., `sqlite2`, `mysql2`, replicas) are introduced.

---

## 🔄 Target-Aware Migrations

The migration runner supports targeting specific connections in each migration file:

```ts
import type { SqliteMigration } from '../runner.ts';
import type { MySqlMigration } from '../runner.ts';

// Declare targeted connection:
export const target: SqliteMigration['target'] = 'sqlite1';
// export const target: MySqlMigration['target'] = 'mysql1';
```

When executing migrations:
```bash
bun run migrate sqlite
```
The migration runner only executes migrations for the targeted database engine and records the execution history in its dedicated tracking table.

---

## ⚡ Redis & Queue Wiring

The `redis1` connection serves as the default backend for:
- Cache utilities (`src/utils/cache.util.ts`)
- BullMQ queue instances (`src/queues/base.queue.ts`)
- Background worker consumers (`src/workers/index.ts`)

Redis connections support enhanced environment configurations:
- `REDIS_PASSWORD_1`: Optional password authentication.
- `REDIS_TLS_1`: TLS/SSL connection toggle (`true`/`false`).
- `REDIS_DB_1`: Dedicated Redis database index selector (e.g., `0`, `1`, `2`).

---

[Back to Reference](./README.md)
