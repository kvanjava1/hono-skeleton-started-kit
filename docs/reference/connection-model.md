# Connection Model

The skeleton no longer treats the primary engines as single implicit connections.

## Named Connections

- SQLite: `sqlite1`
- MySQL: `mysql1`, `mysql2`
- MongoDB: `mongo1`, `mongo2`
- Redis: `redis1`, `redis2`
- PostgreSQL: `pg1`, `pg2`

## Compatibility Defaults

Defaults still exist for backward compatibility:

- `getMysqlPool()` -> `mysql1`
- `getMongoDb()` -> `mongo1`
- `getRedis()` -> `redis1`
- `getPgSql()` -> `pg1`

For new code, explicit targeting is preferred.

## Target-Aware Migrations

These engines use target-aware migrations:

- SQLite
- MySQL
- MongoDB
- PostgreSQL

Examples:

```ts
export const target: SqliteMigration['target'] = 'sqlite1';
export const target: MySqlMigration['target'] = 'mysql1';
export const target: MongoMigration['target'] = 'mongo1';
export const target: PgMigration['target'] = 'pg1';
```

## Redis Defaults

Redis also uses named connections.

Current defaults:

- cache utilities use `redis1`
- BullMQ queue and worker factories use `redis1`

[Back to Reference](./README.md)
