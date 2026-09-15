# 01 — Tracing Setup

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Ditunda
> **Dependency:** Ya (`@opentelemetry/*`)

## Tujuan

Memasang tracing end-to-end dengan OpenTelemetry, dapat dinyalakan/dimatikan
lewat konfigurasi.

## Langkah

1. **Konfigurasi** — tambah `tracingEnabled` (default `false`) di
   `src/configs/app.config.ts`, plus endpoint collector bila ada.
2. **Modul tracing** — buat `src/utils/tracing.util.ts`:
   - `startTracing()` — inisialisasi SDK + exporter.
   - `stopTracing()` — flush & shutdown saat proses berhenti.
   - helper `withSpan(name, fn)` untuk membungkus operasi.
3. **Middleware** — buat `src/middlewares/common/tracing.middleware.ts`:
   membuat root span `http.request` dengan atribut `http.method`,
   `http.route`, `http.status_code`.
4. **Startup** — panggil `startTracing()` di `src/index.ts` sebelum
   `connectAllDatabases()`; `stopTracing()` saat shutdown.
5. **Korelasi** — perluas `RequestContext` (`src/utils/context.util.ts`) dengan
   `traceId`; sertakan di logger.
6. **Database/cache** — gunakan instrumentasi otomatis OpenTelemetry untuk
   driver yang dipakai (SQLite/MySQL/PG/Redis) bila tersedia.
7. **Queue** — sertakan `traceparent` di payload job
   (`src/jobs/example/crudCreate.job.ts`), lalu lanjutkan span di worker
   (`src/queues/base.queue.ts`).

## Prinsip

- **Fail-open**: kegagalan exporter tidak boleh menggagalkan request.
- **Sampling**: jangan trace 100% di production.
- **Minim atribut**: jangan masukkan body/secret ke span.

## Test

- Unit: `withSpan` membuat span dengan nama benar; error di dalamnya tercatat.
- Integration: request menghasilkan trace; `TRACING_ENABLED=false` → tidak ada
  overhead/trace.
- Regresi: `bun test`, `bun run typecheck`.

## Definisi Selesai

- [ ] Tracing bisa dinyalakan/dimatikan.
- [ ] Root span + span anak terbentuk.
- [ ] `traceId` ↔ `reqId` terkait.
- [ ] Konteks trace terbawa ke worker.
- [ ] `bun test` hijau, `bun run typecheck` bersih.
