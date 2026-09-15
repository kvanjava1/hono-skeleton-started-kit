# [E7] — Analisis Codebase untuk Tracing

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Draft

Analisis kode yang akan disentuh ketika tracing diimplementasikan.

---

## 1. Konteks Request — `src/utils/context.util.ts`

- `RequestContext` saat ini hanya `{ requestId }`.
- **Rencana**: tambah `traceId` (dan mungkin `spanId`) agar logger bisa
  menyertakannya. Bisa juga menyimpan objek span aktif.

## 2. Middleware Konteks — `src/middlewares/common/context.middleware.ts`

- Menjalankan `next()` di dalam `requestContext.run({ requestId })`.
- **Rencana**: di sini tempat natural untuk memulai root span
  `http.request` dan menyimpan trace context.

## 3. Request ID — `hono/request-id`

- Sudah menghasilkan/meneruskan `reqId`.
- **Rencana**: kaitkan `reqId` dengan `traceId` agar bisa saling dicari.

## 4. Logger — `src/utils/logger.util.ts`

- Sudah menulis `reqId` ke setiap entry.
- **Rencana**: tambah `traceId`/`spanId` bila tersedia, supaya log dan trace
  bisa dikorelasikan.

## 5. Startup — `src/index.ts`

- Titik inisialisasi proses (API dan worker).
- **Rencana**: panggil `startTracing()` di awal sebelum `connectAllDatabases()`,
  dan `stopTracing()` saat shutdown.

## 6. Middleware — `src/middlewares/common/index.ts`

- Tempat memasang middleware berurutan.
- **Rencana**: tambah middleware tracing (span per request) sedini mungkin,
  setelah `requestId`.

## 7. Repository & Service (contoh) — `src/repositories/example/*`, `src/services/example/*`

- **Rencana**: bungkus operasi penting dengan span (`db.sqlite.insert`,
  `cache.get`, dsb.). Untuk database, OpenTelemetry punya instrumentasi
  otomatis untuk banyak driver.

## 8. Queue — `src/queues/base.queue.ts`, `src/jobs/example/crudCreate.job.ts`

- Worker adalah proses terpisah, jadi konteks trace tidak otomatis terbawa.
- **Rencana**: sertakan trace context di payload job (mis. `traceparent`), lalu
  buat span lanjutan di worker.

## 9. Konfigurasi — `src/configs/app.config.ts`

- **Rencana**: tambah `tracingEnabled` (default `false`) dan konfigurasi
  exporter (endpoint collector).

## 10. Konvensi yang Harus Diikuti

- Jangan mengakses `process.env` langsung; gunakan config.
- Jangan menambah dependency tanpa justifikasi (aturan `H20`).
- Tracing harus bisa dimatikan (feature flag) agar tidak membebani production.
