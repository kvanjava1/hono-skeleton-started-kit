# 07 Development Operations

## Fullstack Development Workflow

Aplikasi menjalankan dua server di mode pengembangan:
1. **Hono Server (Port 8080)**: Melayani API dan merender HTML awal (SSR).
2. **Vite Dev Server (Port 5173)**: Melayani aset JS/Vue dengan Hot Module Replacement (HMR).

### Development Scripts
- `bun run dev:all`: Menjalankan Hono dan Vite secara bersamaan (disarankan).
- `bun run dev`: Menjalankan Hono (backend).
- `bun run dev:client`: Menjalankan Vite (frontend).
- `bun run build:client`: Membangun aset Vue ke dalam folder `dist/` dan membuat `manifest.json`.
- `bun run typecheck`: Melakukan pengecekan tipe TypeScript di seluruh proyek.
- `bun run prod`: Menjalankan aplikasi di mode produksi.

### Build and Deployment Shape
Build backend dilakukan dengan:
- `bun build ./src/index.ts --compile --outfile server`

Deployment Fullstack memerlukan folder `dist/` (hasil build frontend) agar Hono bisa melayani aset statis dan melakukan fallback SPA.

## Environment Separation

Environment dipisah lewat:

- `.env.dev`
- `.env.prod`
- `.env.example`

Pemisahan ini dipakai langsung di script `bun run --env-file=...`.

## Build and Deployment Shape

Build dilakukan dengan:

- `bun build ./src/index.ts --compile --outfile server`

Ini berarti deploy bisa dilakukan dengan binary hasil compile, bukan hanya source + Bun runtime.

## Migration and Seeder Strategy

Migration tooling mendukung:

- MySQL
- PostgreSQL
- MongoDB
- SQLite

Seeder tooling juga tersedia.

Catatan penting:

- SQLite memakai satu folder migration, tetapi setiap file wajib deklarasi target `sqlite1`
- MySQL migration sekarang juga target-aware: `mysql1` atau `mysql2`
- MongoDB migration sekarang juga target-aware: `mongo1` atau `mongo2`
- PostgreSQL migration sekarang juga target-aware: `pg1` atau `pg2`

## Generator Workflow

CLI generator `scripts/make.ts` dapat membuat:

- migration
- seeder
- controller
- service
- repository
- schema
- job

Ini penting karena modul baru idealnya mengikuti stub repo, bukan ditulis dengan style baru yang tidak sinkron.

## Testing Status

Sekarang sudah ada dua kelompok test yang nyata:

- test fondasi multi-connection dan target migration pada beberapa engine
- test runnable CRUD reference untuk modul `example`

Artinya kondisi saat ini adalah:

- sudah ada regression safety net terbatas untuk config parsing, validasi target migration, dan alur CRUD reference
- belum ada integration test end-to-end untuk seluruh engine dan seluruh dependency nyata
- manual verification masih penting
- refactor fondasi tetap butuh kehati-hatian lebih

## Performance Considerations Visible in Code

Yang terlihat:

- response compression aktif
- SQLite memakai `WAL`
- Redis dipakai untuk cache dan queue
- queue dan cache default ke `redis1`
- rate limiter memakai memory map sederhana

Yang belum terlihat:

- query optimization layer domain
- profiling
- metrics
- benchmark

## Security Measures Visible in Code

Yang sudah ada:

- secure headers
- CORS
- JSON-only middleware
- rate limiting
- production error masking

Yang belum ada:

- authentication
- authorization
- secret rotation strategy
- audit logging
- CSRF discussion, walau ini lebih relevan untuk browser/session model tertentu

## Operational Caveats

- logger menulis ke filesystem, jadi environment read-only bisa membatasi file logging
- rate limiter in-memory tidak cocok untuk multi-instance production
- worker sekarang sudah punya job referensi `create-example`, tetapi project turunan tetap perlu mengganti atau menghapusnya sesuai domain nyata
- type checking kini dapat dieksekusi as-is menggunakan `bun run typecheck` (menjalankan `tsc --noEmit`) yang memastikan strict type safety tanpa intervensi build murni node.
