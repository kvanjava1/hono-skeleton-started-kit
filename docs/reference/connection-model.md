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

## 🏊 Connection Pooling (MySQL & PostgreSQL)

Both MySQL and PostgreSQL connections are initialized as **singleton connection pools** (`Map<ConnectionName, Pool>`) and cached by Drizzle ORM (`drizzleMysqlClients` / `drizzlePgClients`). Incoming HTTP requests reuse pooled connections instead of opening new TCP connections per request, preventing connection exhaustion and memory spikes.

### MySQL (`mysql2/promise`)
Configured in `src/configs/mysql.config.ts` and `src/database/mysql.connection.ts`:
- `MYSQL_CONNECTION_LIMIT_1` (fallback `MYSQL_CONNECTION_LIMIT`): Max concurrent connections in pool (default: `10`).
- `MYSQL_QUEUE_LIMIT_1` (fallback `MYSQL_QUEUE_LIMIT`): Max queued connection requests when pool is full; `0` = unlimited (default: `0`).
- `MYSQL_IDLE_TIMEOUT_1` (fallback `MYSQL_IDLE_TIMEOUT`): Idle connection timeout in milliseconds before closing (default: `30000`).

### PostgreSQL (`postgres.js`)
Configured in `src/configs/pg.config.ts` and `src/database/pg.connection.ts`:
- `PG_MAX_CONNECTIONS_1` (fallback `PG_MAX_CONNECTIONS`): Max concurrent connections in pool (default: `10`).
- `PG_IDLE_TIMEOUT_1` (fallback `PG_IDLE_TIMEOUT`): Idle connection timeout in seconds before closing (default: `30`).
- `PG_CONNECT_TIMEOUT_1` (fallback `PG_CONNECT_TIMEOUT`): Initial connection timeout in seconds (default: `30`).

---

[Back to Reference](./README.md)
