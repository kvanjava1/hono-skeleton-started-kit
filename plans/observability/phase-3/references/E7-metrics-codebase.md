# [E7] — Analisis Codebase untuk Metrics

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Final

Analisis kode yang akan disentuh phase-3.

## 1. Middleware — `src/middlewares/common/index.ts`

- Urutan middleware: `requestId` → `context` → `compress` → `secureHeaders` →
  `rateLimiter` → `requestLogger`.
- **Rencana**: tambah `metricsMiddleware` (mengukur tiap request). Tempat yang
  wajar: setelah `requestLogger` atau sebelum `rateLimiter` — yang penting
  konsisten dan menangkap semua request.

## 2. Log Request — `src/middlewares/common/logger.middleware.ts`

- Sudah punya `method`, `path`, `status`, `durationMs`.
- **Rencana**: metrics middleware memakai data yang sama; pastikan `path`
  memakai pola route.

## 3. Route API — `src/routes/api/index.ts`

- Tempat `/api/health`, `/api/spec`, `/api/docs`, dan CRUD.
- **Rencana**: tambah `GET /metrics`.

## 4. Config — `src/configs/app.config.ts`

- **Rencana**: tambah `metricsEnabled` (`METRICS_ENABLED`, default `false`).

## 5. OpenAPI — `@hono/zod-openapi`

- `/metrics` sebaiknya **tidak** masuk OpenAPI spec publik (format teks
  Prometheus, bukan JSON API). Daftarkan sebagai route biasa (`apiRoutes.get`),
  bukan `createRoute`.

## 6. Pola Route untuk Label

- Hono menyediakan informasi route yang cocok. Alternatif: gunakan
  `c.req.routePath` bila tersedia, atau normalisasi path dengan mengganti
  segmen angka/UUID menjadi `{id}`.
- Ini penting untuk NFR cardinality.

## 7. Dependency

- Opsi (a) `prom-client`: tambah ke `package.json`.
- Opsi (b): buat `src/utils/metrics.util.ts` tanpa dependency.

## 8. Konvensi

- Utils: `snake_case.util.ts`; middleware: `camelCase.middleware.ts`.
- Jangan mengakses `process.env` langsung; gunakan config.
