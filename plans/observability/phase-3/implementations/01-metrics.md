# 01 — Metrics

> **Versi:** 1.1.0
> **Terakhir diperbarui:** 2026-09-14
> **Status:** ✅ Selesai
> **Dependency:** `prom-client` (Apache-2.0)

## Tujuan

Menyediakan metrik RED (Rate, Errors, Duration) lewat endpoint `/metrics`,
dengan label yang aman dari cardinality.

## Perubahan

1. **Konfigurasi** — tambah `metricsEnabled` (`METRICS_ENABLED`, default `false`)
   di `src/configs/app.config.ts`.
2. **Modul metrik** — `src/utils/metrics.util.ts`:
   - `http_requests_total` (counter) dengan label `method`, `path`, `status`,
     `kind`;
   - `http_request_duration_ms` (histogram) dengan label `method`, `path`,
     `kind`;
   - `classifyRequestKind()` untuk menentukan `kind` (`api`/`web`);
   - fungsi `renderMetrics()` untuk output teks Prometheus.
   - Opsi (a): pembungkus `prom-client`. Opsi (b): implementasi in-house.
3. **Middleware** — `src/middlewares/common/metrics.middleware.ts`:
   - mulai timer sebelum `next()`, catat setelah selesai;
   - gunakan **pola route** untuk `path` (mis. `c.req.routePath` atau
     normalisasi segmen angka/UUID).
4. **Pasang middleware** di `src/middlewares/common/index.ts`.
5. **Route** — `GET /metrics` di `src/routes/api/index.ts`; `404` bila
   `metricsEnabled` false.

## Keputusan

| Opsi | Catatan |
|---|---|
| (a) `prom-client` | Rekomendasi; tambah dependency |
| (b) in-house | Tanpa dependency; lebih banyak kode |

## Test

- Unit: counter bertambah; nilai masuk bucket histogram yang benar.
- Integration: `/metrics` `200`/`404`; label `path` memakai pola route.
- Regresi: `bun test`, `bun run typecheck`.

## Definisi Selesai

- [x] Opsi diputuskan (`prom-client`).
- [x] `/metrics` berfungsi dan dapat dimatikan.
- [x] Cardinality terkendali (label pola route + exclude `/metrics`).
- [x] `bun test` hijau (77 pass), `bun run typecheck` bersih.
