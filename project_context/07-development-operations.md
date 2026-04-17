# 07 Development Operations

## Scripts

Berdasarkan `package.json`, script utama adalah:

- `bun run dev`
- `bun run prod`
- `bun run build`
- `bun run migrate:dev`
- `bun run migrate:prod`
- `bun run seed:dev`
- `bun run typecheck`
- `bun run make`
- `bun run worker:dev`
- `bun run worker:prod`

Ada juga jalur binary hasil compile:

- `server:bin:dev`
- `server:bin:prod`
- `worker:bin:dev`
- `worker:bin:prod`

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
