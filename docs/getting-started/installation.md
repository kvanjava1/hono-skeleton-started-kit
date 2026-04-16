# Installation

This project is a Bun + Hono skeleton with:

- SQLite, MySQL, MongoDB, PostgreSQL, Redis
- named multi-connections across all primary engines
- BullMQ worker support

## Runtime Versions

- Bun: the repo does not pin `engines`, but current dev typings use `@types/bun@1.3.9`, so Bun `1.3.x` is a safe baseline
- Hono: `^4.6.0`

## Installation

```bash
bun install
cp .env.example .env.dev
```

## Configure Databases

Example `.env.dev`:

```env
DB_SQLITE_ENABLED=true
DB_MYSQL_ENABLED=false
DB_PG_ENABLED=false
DB_MONGO_ENABLED=false
DB_REDIS_ENABLED=true
```

### SQLite

```env
SQLITE_DB_PATH_1=./storages/database/sqlite/sqlite1.dev.db
```

### MySQL

```env
MYSQL_HOST_1=127.0.0.1
MYSQL_PORT_1=3306
MYSQL_USER_1=root
MYSQL_PASSWORD_1=
MYSQL_DATABASE_1=myapp

MYSQL_HOST_2=127.0.0.1
MYSQL_PORT_2=3306
MYSQL_USER_2=root
MYSQL_PASSWORD_2=
MYSQL_DATABASE_2=myapp_2
```

Compatibility note:

- legacy `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` fall back to `mysql1`
- new code should use explicit named connections such as `mysql1` and `mysql2`

### MongoDB

```env
MONGO_HOST_1=127.0.0.1
MONGO_PORT_1=27017
MONGO_DB_NAME_1=myapp

MONGO_HOST_2=127.0.0.1
MONGO_PORT_2=27017
MONGO_DB_NAME_2=myapp_2
```

Compatibility note:

- legacy `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB_NAME` fall back to `mongo1`
- new code should use explicit named connections such as `mongo1` and `mongo2`

### Redis

```env
REDIS_HOST_1=127.0.0.1
REDIS_PORT_1=6379

REDIS_HOST_2=127.0.0.1
REDIS_PORT_2=6380
```

Compatibility note:

- legacy `REDIS_HOST` and `REDIS_PORT` fall back to `redis1`
- cache utilities default to `redis1`
- BullMQ queue and worker factories also default to `redis1`

### PostgreSQL

```env
PG_HOST_1=127.0.0.1
PG_PORT_1=5432
PG_USER_1=postgres
PG_PASSWORD_1=
PG_DATABASE_1=myapp

PG_HOST_2=127.0.0.1
PG_PORT_2=5432
PG_USER_2=postgres
PG_PASSWORD_2=
PG_DATABASE_2=myapp_2
```

Compatibility note:

- legacy `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` fall back to `pg1`
- new code should use explicit named connections such as `pg1` and `pg2`

## Run Migrations

```bash
bun run migrate:dev
bun run migrate:dev sqlite
bun run migrate:dev mysql
```

## Run Seeders

```bash
bun run seed:dev
bun run seed:dev sqlite
bun run seed:dev pg
```

## Start the App

```bash
bun run dev
```

Default health check:

```text
GET /api/health
```

## Generate Files

```bash
bun run make migration sqlite create_users
bun run make seeder sqlite UserSeeder
bun run make controller Product
bun run make service sqlite Product
bun run make repository sqlite Product
```

[Back to Getting Started](./README.md)
