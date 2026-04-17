# 06 Dependencies Integrations

## Third-Party Packages

### Core runtime and HTTP

- `hono`: framework HTTP utama
- `@hono/zod-validator`: validasi request berbasis Zod di level route
- `zod`: schema validation dan type inference

### Data and storage

- `mysql2`: koneksi MySQL
- `postgres`: koneksi PostgreSQL
- `mongodb`: koneksi MongoDB
- `ioredis`: koneksi Redis
- `bullmq`: queue dan worker background

### Development

- `typescript`
- `@types/bun`
- `@types/node`
- `@types/ioredis`
- `@types/pg`

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

Ada helper cache di [src/utils/cache.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/cache.util.ts).

Kemampuan yang sudah ada:

- set
- get
- delete
- delete by pattern
- mget
- mset

Ini memberi jalur reuse untuk caching sederhana tanpa menambah abstraksi baru dulu.

## Integration Risk Notes

- semua integrasi database bergantung pada env toggle
- queue tidak berguna bila Redis tidak aktif
- tidak ada fallback domain-level bila database tertentu gagal di luar startup
- belum ada wrapper observability atau health integration per dependency selain test saat startup
