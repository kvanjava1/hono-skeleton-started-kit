# 03 Technical Deep Dive

## Runtime and Boot Process

Startup utama ada di [src/index.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/index.ts).

Perilaku startup:

- cek apakah process dijalankan dengan `--worker`
- connect semua database yang toggle-nya aktif
- jika mode API, jalankan `serve()` dari Bun
- jika mode worker, panggil `startWorkers()`
- pasang `SIGINT` dan `SIGTERM` untuk shutdown

## API Endpoints and Routing

Routing saat ini hanya ada di [src/routes/index.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/routes/index.ts).

Endpoint aktif:

- `GET /api/health`
- `GET /api/spec` — OpenAPI 3.0 JSON spec
- `GET /api/docs` — Scalar API Reference (interaktif)
- `POST /api/example/cruds`
- `GET /api/example/cruds`
- `GET /api/example/cruds/{id}`
- `PUT /api/example/cruds/{id}`
- `DELETE /api/example/cruds/{id}`
- `POST /api/example/cruds/job` — enqueue async CRUD creation

Response:

- memakai `successResponse()`
- memakai contract `status`, `message`, dan `data`

Route modular per feature sekarang sudah ada dalam bentuk modul referensi `example`.

## Middleware Stack

Middleware diatur secara modular di `src/middlewares/` dengan pola dispatcher berbasis path.

Urutan eksekusi secara umum:

1. **Common (Semua Request)**: `requestId`, `context`, `compress`, `secureHeaders`, `rateLimiter`, `requestLogger`.
2. **API Specific (`/api/*`)**: `cors` (ketat), `jsonOnlyMiddleware`.
3. **Web Specific (Non-API)**: `spaFallback` (static assets dari dist).
4. **Global**: `app.onError(errorHandler)`

Dispatcher utama ada di `src/middlewares/index.ts` yang mengarahkan middleware ke Sub-App atau Path yang tepat.
### Notes

- request id dibuat sebelum context dijalankan
- logger bisa mengambil context request dari `AsyncLocalStorage`
- rate limiter menggunakan Redis (`DB_REDIS_ENABLED=true`) dengan fallback ke memory `Map` jika Redis tidak aktif
- `jsonOnlyMiddleware` mengembalikan HTTP 415 untuk POST/PUT/PATCH tanpa header `Content-Type: application/json`

## Error Handling

Komponen utama:

- [src/utils/errors.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/errors.util.ts)
- [src/middlewares/errorHandler.middleware.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/middlewares/errorHandler.middleware.ts)

Hierarchy yang terlihat:

- `AppError`
- `ValidationError`
- `NotFoundError`
- `DatabaseError`
- `ConflictError`
- `DuplicateOrderError`
- `UnauthorizedError`
- `InvalidTokenError`
- `ForbiddenError`
- `RateLimitError`
- `ScrapingError`

Global handler melakukan:

- transform duplicate DB error menjadi `ConflictError`
- transform `ZodError` menjadi `ValidationError`
- log warning untuk operational error
- log error untuk unexpected error
- masking error message di production

## Response Layer

Response util ada di [src/utils/response.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/response.util.ts).

Contract response:

- `status`
- `message`
- `data`

Ini menjadi response contract informal untuk semua endpoint baru.

## Drizzle ORM

Proyek menggunakan **Drizzle ORM** sebagai query builder untuk SQL databases.

- **Table definitions**: `src/database/schema/example/crud.ts` menggunakan `sqliteTable`, `text`, `integer`
- **Client wrapper**: `src/database/drizzle.ts` — `getDrizzleDb(connectionName)` dengan cache per connection
- **Repository**: `src/repositories/example/crud.repository.ts` menggunakan Drizzle query builder (`db.select().from(cruds).where(...)`)
- **Not used for MongoDB**: MongoDB tetap menggunakan native driver (`mongodb`) karena Drizzle tidak mendukung relational query untuk MongoDB

## Database Layer

### SQLite

File: [src/database/sqlite.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/sqlite.connection.ts)

Karakteristik:

- satu koneksi bernama `sqlite1`
- lazy init connection
- otomatis membuat directory file database
- mengaktifkan `WAL`
- mengatur `busy_timeout`
- migration SQLite sudah target-aware per connection

Ini adalah database path default yang paling konkret di repo saat ini.

### MySQL

File: [src/database/mysql.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/mysql.connection.ts)

Karakteristik:

- pool registry berbasis `mysql2/promise`
- named connections: `mysql1`
- compatibility default ke `mysql1`
- startup test connection via `ping()`
- migration MySQL sudah target-aware per connection

### PostgreSQL

File: [src/database/pg.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/pg.connection.ts)

Karakteristik:

- connection registry via `postgres`
- named connections: `pg1`
- compatibility default ke `pg1`
- startup test via `SELECT 1`
- migration PostgreSQL sudah target-aware per connection

### MongoDB

File: [src/database/mongo.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/mongo.connection.ts)

Karakteristik:

- client + db registry per target
- named connections: `mongo1`
- compatibility default ke `mongo1`
- pool size dikonfigurasi langsung di connection setup
- startup test via `ping`
- migration MongoDB sudah target-aware per connection

### Redis

File: [src/database/redis.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/redis.connection.ts)

Karakteristik:

- client registry per target
- named connections: `redis1`
- compatibility default ke `redis1`
- retry strategy terbatas
- startup test via `PING`
- cache util default ke `redis1`
- queue dan worker factory default ke `redis1`

## Schema and Data Model Status

Sekarang ada modul referensi `cruds` dengan:

- **Drizzle table definition** di `src/database/schema/example/crud.ts`
- **Migration** `20260616_create_cruds.ts` untuk SQLite `sqlite1`
- **Zod validation schemas** di `src/validations/example/crud.ts` (terpisah dari table definition)
- **Soft delete** pattern via `deleted_at TEXT DEFAULT NULL` — `DELETE` endpoint melakukan `UPDATE SET deleted_at = datetime('now')`, repository filter `WHERE deleted_at IS NULL`

Konsekuensinya:

- repo sudah punya contoh entity end-to-end yang runnable dengan Drizzle ORM
- tetapi entity itu tidak boleh dibaca sebagai domain bisnis utama
- relationship bisnis antar entity nyata tetap belum ada
- repo masih netral terhadap domain, dengan satu reference module sebagai acuan implementasi

## Queue and Worker

Komponen:

- [src/queues/base.queue.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/queues/base.queue.ts)
- [src/jobs/example/crudCreate.job.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/jobs/example/crudCreate.job.ts) — job example
- [src/workers/index.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/workers/index.ts)

Yang tersedia:

- queue factory
- worker factory
- logging event `completed` dan `failed`
- default queue Redis connection `redis1`
- opsi explicit Redis connection name di factory queue/worker
- contoh job domain: `crud-create` (enqueue + process via worker)
- queue name **tidak boleh mengandung `:`** — gunakan `-` separator
- worker factory siap digunakan

## State Management

State backend yang terlihat:

- request-scoped context via `AsyncLocalStorage`
- rate-limit store via Redis (fallback memory jika Redis tidak aktif)
- cache optional via Redis `redis1` secara default
- semua config menggunakan Proxy/function `createLazyConfig()` dengan `reset*Config()` untuk testability

State frontend (Vue):

- Initial state dikirim dari Hono via `window.__INITIAL_STATE__`.
- Vue mengambil alih manajemen state interaktif di rute `/dashboard/*` dan turunannya.

## File Storage and Upload

Belum ada mekanisme upload atau object storage di codebase default.
