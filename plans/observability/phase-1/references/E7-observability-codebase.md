# [E7] — Analisis Codebase untuk Observability

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Final

Dokumen ini menganalisis kode yang **sudah ada** dan akan tersentuh oleh
perbaikan observability. Tujuannya: memahami cara kerja sebelum mengubah.

---

## 1. Logger — `src/utils/logger.util.ts`

- Menulis **JSON Lines** ke `storages/logs/<service>/<tanggal>/<level>.jsonl`
  dan juga ke console.
- Field yang sudah ada: `time`, `level`, `service`, `reqId`, `module`, `msg`,
  `data`.
- `service` diambil dari env `SERVICE_NAME` (`app`, `cli`, `queue`).
- `module` diparsing dari prefix `[NamaModule]` pada pesan.
- `data` diubah oleh `formatDataForJson`: `Error` → `{message, name, stack}`,
  objek → deep copy, primitif → string.
- Menulis via `fs.WriteStream` (buffered, tidak memblokir event loop).
- Retensi log dikontrol `LOG_RETENTION_DAYS`.
- **Belum ada**: filter level, redaksi data sensitif.

## 2. Konteks Request — `src/utils/context.util.ts`

- `RequestContext` saat ini hanya berisi `requestId`.
- Disimpan di `AsyncLocalStorage`, diambil oleh logger untuk mengisi `reqId`.
- **Peluang**: bisa diperluas untuk membawa `traceId` di phase-4 (tracing).

## 3. Middleware Konteks — `src/middlewares/common/context.middleware.ts`

- Menjalankan `next()` di dalam `requestContext.run({ requestId })`.
- `requestId` berasal dari `hono/request-id` (`c.get("requestId")`).

## 4. Request ID — `hono/request-id`

- Middleware `requestId()` dipasang paling awal di
  `src/middlewares/common/index.ts`.
- Secara bawaan: membaca header `X-Request-Id` dari klien bila valid, jika tidak
  membuat UUID baru, lalu menuliskannya kembali ke respons.
- Artinya **korelasi dasar sudah berjalan**.

## 5. Log Request — `src/middlewares/common/logger.middleware.ts`

- Mencatat dua baris: saat request masuk, dan saat selesai (`status`,
  `duration`).
- Masalah: `method`, `path`, `status`, `duration` ada di dalam **teks** pesan,
  bukan field JSON.

## 6. Error Handler — `src/middlewares/common/errorHandler.ts`

- Sudah kaya konteks saat error: `requestId`, `method`, `path`, `query`, `ip`,
  `userAgent`, `contentType`.
- Membedakan operational (warn) vs unexpected (error).
- Melakukan masking di production.
- **Relevan**: daftar field ini bisa jadi acuan format log request terstruktur.

## 7. Health — `src/routes/api/index.ts`

- `GET /api/health` mengembalikan `uptime` dan `timestamp`.
- Tidak memeriksa dependency apa pun.
- Route didaftarkan di `apiRoutes` (`OpenAPIHono`).

## 8. Database Startup — `src/database/index.ts`

- `connectAllDatabases()` mengoneksikan dan menguji hanya engine yang aktif
  (sesuai `configApp.db.*`).
- Tersedia `testAll*Connections()` per engine yang bisa dipakai ulang untuk
  readiness.

## 9. Konfigurasi — `src/configs/app.config.ts`

- `ConfigApp` berisi `port`, `nodeEnv`, `db` (toggle), `logRetentionDays`.
- **Peluang**: tambah `logLevel` (phase-1) dan `metricsEnabled` (phase-3).

## 10. Queue — `src/queues/base.queue.ts`

- `createQueue()` dan `createWorker()`.
- Event `completed`/`failed` sudah dicatat, tetapi `jobId` masih di dalam teks
  pesan.

## 11. Konvensi yang Harus Diikuti

- Import memakai ekstensi `.ts`.
- Response memakai `successResponse()` / `errorResponse()`.
- Error memakai subclass `AppError`.
- Utils: `snake_case.util.ts`; middleware: `camelCase.middleware.ts`.
- Tidak mengakses `process.env` langsung di application layer (kecuali pola yang
  sudah ada di connection layer); gunakan config.
- Jangan menambah dependency tanpa justifikasi.
