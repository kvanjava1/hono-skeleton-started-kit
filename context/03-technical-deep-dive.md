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
- `POST /api/examples`
- `GET /api/examples`
- `GET /api/examples/:id`
- `PUT /api/examples/:id`
- `DELETE /api/examples/:id`

Response:

- memakai `successResponse()`
- memakai contract `status`, `message`, dan `data`

Route modular per feature sekarang sudah ada dalam bentuk modul referensi `example`.

## Middleware Stack

Middleware dipasang di [src/middlewares/index.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/middlewares/index.ts).

Urutan middleware:

1. `requestId()`
2. `contextMiddleware`
3. `compress()`
4. `cors()`
5. `secureHeaders()`
6. `jsonOnlyMiddleware`
7. `rateLimiterMiddleware`
8. `requestLoggerMiddleware`
9. `app.onError(errorHandler)`

### Notes

- request id dibuat sebelum context dijalankan
- logger bisa mengambil context request dari `AsyncLocalStorage`
- rate limiter masih berbasis memory `Map`, belum distributed

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
- named connections: `mysql1`, `mysql2`
- compatibility default ke `mysql1`
- startup test connection via `ping()`
- migration MySQL sudah target-aware per connection

### PostgreSQL

File: [src/database/pg.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/pg.connection.ts)

Karakteristik:

- connection registry via `postgres`
- named connections: `pg1`, `pg2`
- compatibility default ke `pg1`
- startup test via `SELECT 1`
- migration PostgreSQL sudah target-aware per connection

### MongoDB

File: [src/database/mongo.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/mongo.connection.ts)

Karakteristik:

- client + db registry per target
- named connections: `mongo1`, `mongo2`
- compatibility default ke `mongo1`
- pool size dikonfigurasi langsung di connection setup
- startup test via `ping`
- migration MongoDB sudah target-aware per connection

### Redis

File: [src/database/redis.connection.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/database/redis.connection.ts)

Karakteristik:

- client registry per target
- named connections: `redis1`, `redis2`
- compatibility default ke `redis1`
- retry strategy terbatas
- startup test via `PING`
- cache util default ke `redis1`
- queue dan worker factory default ke `redis1`

## Schema and Data Model Status

Sekarang ada schema referensi netral untuk tabel `examples` di SQLite `sqlite1`.

Konsekuensinya:

- repo sudah punya contoh entity end-to-end yang runnable
- tetapi entity itu tidak boleh dibaca sebagai domain bisnis utama
- relationship bisnis antar entity nyata tetap belum ada
- repo masih netral terhadap domain, dengan satu reference module sebagai acuan implementasi

## Queue and Worker

Komponen:

- [src/queues/base.queue.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/queues/base.queue.ts)
- [src/workers/index.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/workers/index.ts)

Yang tersedia:

- queue factory
- worker factory
- logging event `completed` dan `failed`
- default queue Redis connection `redis1`
- opsi explicit Redis connection name di factory queue/worker
- worker registration nyata untuk modul referensi `example`
- job processor nyata `create-example`

## State Management

Tidak ada frontend atau state management client-side.

State backend yang terlihat:

- request-scoped context via `AsyncLocalStorage`
- in-memory rate-limit store
- cache optional via Redis `redis1` secara default

## File Storage and Upload

Belum ada mekanisme upload atau object storage di codebase default.
