# Installation

This project is a Bun + Hono skeleton with:

- SQLite, MySQL, MongoDB, PostgreSQL, Redis
- named multi-connections across all primary engines
- BullMQ worker support

## Runtime Versions

- Bun: project runtime is pinned to `1.4.3` in `.bun-version`; CI uses the same
  version. TypeScript declarations use `@types/bun@1.4.2`.
- Hono: `^4.6.0`

## Installation

```bash
bun install
cp .env.example .env
```

This project uses a **single `.env` file per machine** (Laravel-style
convention):

- local/development: `.env` with development values (see `.env.example`)
- production server: its own `.env` with production values (`NODE_ENV=production`, hosts, passwords, DB paths)

`.env` is gitignored and never shared between machines. Bun loads it
automatically for the app, CLI scripts (`migrate`, `seed`, `worker`),
`bun test`, and compiled binaries — no flags or helper scripts needed.

## Configure Databases

Example `.env`:

```env
DB_SQLITE_ENABLED=true
DB_MYSQL_ENABLED=false
DB_PG_ENABLED=false
DB_MONGO_ENABLED=false
DB_REDIS_ENABLED=true
```

## Configure Observability

```env
LOG_LEVEL=info          # debug | info | warn | error
METRICS_ENABLED=false   # true -> GET /metrics returns Prometheus text
METRICS_TOKEN=          # optional shared secret for /metrics
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
- new code should use explicit named connections such as `mysql1`

### MongoDB

```env
MONGO_HOST_1=127.0.0.1
MONGO_PORT_1=27017
MONGO_DB_NAME_1=myapp
```

Compatibility note:

- legacy `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB_NAME` fall back to `mongo1`
- new code should use explicit named connections such as `mongo1`

### Redis

```env
REDIS_HOST_1=127.0.0.1
REDIS_PORT_1=6379
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
```

Compatibility note:

- legacy `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` fall back to `pg1`
- new code should use explicit named connections such as `pg1`

## Running the App

### Development (Hono JSX + Tailwind CSS)
Run Hono and Vite together so JSX pages render through Hono and Vite serves
Tailwind CSS with hot updates:

```bash
bun run dev:all
```

- **Hono (SSR + API)**: http://localhost:8080
- **Vite (Tailwind CSS)**: http://localhost:5173

You can also run them separately:
- `bun run server:code:dev` (Hono only)
- `bun run dev:css` (Vite only)

### Production
To build and run in production:

```bash
# Compile Tailwind CSS and write its Vite manifest to dist/
bun run build:css

# Start production server
bun run server:code:prod
```

The production server reads the stylesheet path from `dist/.vite/manifest.json`
and serves the compiled file under `/assets/`. Set `NODE_ENV=production` in
the production `.env` (or process environment); `bun run server:code:prod`
follows that value.

## Default Health Checks
- API liveness: `GET /api/health`
- API readiness: `GET /api/health/ready`
- Prometheus metrics: `GET /metrics` (only when `METRICS_ENABLED=true`)
- Web SSR Landing: `GET /`

## Run Migrations

```bash
bun run migrate
bun run migrate sqlite
bun run migrate mysql
```

## Run Seeders

```bash
bun run seed
bun run seed sqlite
bun run seed pg
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
