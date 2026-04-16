# Make CLI

`make` generates files from local stubs.

## Commands

```bash
bun run make migration <target> <name>
bun run make seeder <target> <name>
bun run make controller <name>
bun run make service <target> <name>
bun run make repository <target> <name>
bun run make schema <name>
bun run make job <name>
```

Targets:

- `mysql`
- `mongo`
- `pg`
- `sqlite`

## Examples

```bash
bun run make migration sqlite create_users
bun run make seeder pg ProductSeeder
bun run make controller Product
bun run make service sqlite Product
bun run make repository sqlite Product
bun run make schema Product
bun run make job SendEmail
```

## Generated Migration Reminder

Generated migrations for these engines should declare a target explicitly:

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

## Seeder and Repository Reminder

Generated seeders and repositories may still work through compatibility defaults, but new code should use explicit named connections where possible.

Examples:

```ts
getSqliteDb('sqlite1');
getMysqlPool('mysql1');
getMongoDb('mongo1');
getPgSql('pg1');
getRedis('redis1');
```

[Back to Docs](../README.md)
