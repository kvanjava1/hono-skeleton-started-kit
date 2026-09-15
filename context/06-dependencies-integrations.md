# 06 Dependencies Integrations

## Third-Party Packages

### Core runtime and HTTP

- `hono`: framework HTTP utama
- `@hono/zod-validator`: validasi request berbasis Zod di level route
- `@hono/zod-openapi`: OpenAPI 3.0 spec generation dari Zod schemas
- `zod`: schema validation dan type inference
- `@scalar/hono-api-reference`: Scalar API Reference UI (pengganti Swagger UI)

### Data and storage

- `drizzle-orm`: ORM/query builder untuk SQL databases (SQLite, MySQL, PostgreSQL)
- `drizzle-kit`: Drizzle schema push/migrate CLI (development only)
- `mysql2`: koneksi MySQL (native driver, Drizzle sebagai query builder)
- `postgres`: koneksi PostgreSQL (native driver, Drizzle sebagai query builder)
- `mongodb`: koneksi MongoDB (native driver — Drizzle tidak dipakai untuk MongoDB)
- `ioredis`: koneksi Redis
- `bullmq`: queue dan worker background

### Observability

- `prom-client`: registry metrik + output format Prometheus (Apache-2.0)

### Development

- `typescript`
- `@types/bun`
- `@types/node`

## Drizzle ORM Integration

Drizzle dipakai sebagai query builder, **bukan ORM penuh** (tidak ada repository pattern Drizzle terpisah).

### Cara pakai:
- **Table definition**: `src/database/schema/example/crud.ts` — definisi tabel pakai `sqliteTable`, `text`, `integer`, dll.
- **Client**: `src/database/drizzle.ts` — `getDrizzleDb(connectionName)` mengembalikan instance Drizzle client (cache per connection name)
- **Repository**: Repository panggil `getDrizzleDb("sqlite1")` lalu gunakan Drizzle query builder (`db.select().from(table).where(...)`)

### Notes:
- Drizzle **tidak wajib** dipasang di setiap koneksi — jika engine bukan SQL (MongoDB), tetap pakai native driver
- `drizzle-kit` bisa dipakai untuk generate migrations, tapi proyek ini punya migration runner sendiri di `scripts/migrations/`

## External Integrations Currently Visible

Integrasi yang benar-benar ada saat ini:

- MySQL server
- PostgreSQL server
- MongoDB server
- Redis server

Semua ini bersifat infrastruktur, bukan integrasi bisnis.

## Not Present Yet

Saya tidak melihat integrasi untuk:

- payment gateway
- email provider
- push notification
- object storage
- external webhook target
- analytics platform

## Queue Integration Model

BullMQ dipakai di atas Redis.

Peran tiap bagian:

- Redis: transport dan state queue
- BullMQ Queue: enqueue job
- BullMQ Worker: konsumsi dan proses job

Ini artinya fitur async baru sebaiknya mengikuti jalur yang sudah disiapkan, bukan membuat polling atau custom background runner sendiri.

## Cache Integration Model

Ada helper cache di [src/utils/cache.util.ts](src/utils/cache.util.ts).

Kemampuan yang sudah ada:

- set
- get
- delete
- delete by pattern
- mget
- mset

Ini memberi jalur reuse untuk caching sederhana tanpa menambah abstraksi baru dulu.

## Metrics Integration Model

Metrics disediakan aplikasi, dikonsumsi alat monitoring (model *pull*):

- **Registry & definisi**: `src/utils/metrics.util.ts` (prom-client).
- **Middleware pengukur**: `src/middlewares/common/metrics.middleware.ts`.
- **Endpoint**: `GET /metrics` (teks Prometheus); aktif bila `METRICS_ENABLED=true`.
- **Proteksi opsional**: `METRICS_TOKEN` → wajib header `x-metrics-token`.
- **Metrik yang tersedia**:
  - `http_requests_total{method,path,status,kind}`
  - `http_request_duration_ms{method,path,kind}` (histogram)
  - `queue_jobs_total{queue,status}`
  - `queue_job_duration_ms{queue}` (histogram)
- **Label**: `path` memakai pola route (`{id}`), `kind` = `api`/`web`.
- **Exclude**: `/metrics` tidak dihitung rate limiter, request logger, maupun
  metriknya sendiri.
- **Penyimpanan**: angka disimpan di memori proses; Prometheus yang menyimpan
  time-series jangka panjang.

## Health Integration Model

- `GET /api/health` — liveness (tidak menyentuh dependency).
- `GET /api/health/ready` — readiness: menjalankan test koneksi untuk engine
  yang aktif, dengan timeout 2 detik (`checkDatabaseReadiness()` di
  `src/database/index.ts`).
- Startup juga tetap menguji koneksi via `connectAllDatabases()`.

## Integration Risk Notes

- semua integrasi database bergantung pada env toggle
- queue tidak berguna bila Redis tidak aktif
- tidak ada fallback domain-level bila database tertentu gagal di luar startup
- health/readiness sudah tersedia per dependency aktif
- **known issue**: metrik queue dicatat di proses worker yang tidak membuka
  endpoint `/metrics`, sehingga belum bisa di-scrape dari proses API
