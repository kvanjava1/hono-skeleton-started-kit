# 00 — Overview Metrics

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** ✅ Selesai

## 1. Tujuan

Menyediakan angka untuk grafik dan alert melalui metrik RED: **Rate** (jumlah
request), **Errors** (jumlah error), **Duration** (lama request).

## 2. Requirements

### Functional

- **REQ-M01** — Endpoint `GET /metrics` (format Prometheus).
- **REQ-M02** — Metrik RED tersedia: `http_requests_total` (counter) dan
  `http_request_duration_ms` (histogram).
- **REQ-M03** — Metrics dapat dimatikan lewat `METRICS_ENABLED=false`
  (endpoint → `404`).
- **REQ-M04** — Label `path` memakai pola route, bukan path mentah.
- **REQ-M05** — Metrik HTTP diberi label `kind` (`api`/`web`) untuk memisahkan
  trafik API dan halaman web.

### Non-Functional

- **NFR-M01** — Cardinality label terkendali.
- **NFR-M02** — Overhead minimal saat aktif; nol saat nonaktif.
- **NFR-M03** — Kegagalan pencatatan metrik tidak boleh menggagalkan request.

### Out of Scope

- Dashboard & alerting (Grafana/PagerDuty) — di luar repo.
- Business metrics khusus domain (bisa menyusul).
- Tracing (phase-4).

## 3. Desain

```text
request → metricsMiddleware (mulai timer)
        → ... handler ...
        → response: catat method, path (pola), status, durasi
GET /metrics → registry dalam format teks Prometheus
```

## 4. File yang Akan Disentuh

| File | Jenis |
|---|---|
| `src/configs/app.config.ts` | Tambah `metricsEnabled` |
| `src/utils/metrics.util.ts` | **Baru** — registry metrik |
| `src/middlewares/common/metrics.middleware.ts` | **Baru** — pengukur request |
| `src/middlewares/common/index.ts` | Pasang middleware |
| `src/routes/api/index.ts` | Route `/metrics` |
| `package.json` | `prom-client` (jika opsi a) |

## 5. Testing Strategy

- Unit: counter bertambah; nilai masuk bucket histogram yang benar.
- Integration: `/metrics` → `200` memuat `http_requests_total`;
  `404` saat `METRICS_ENABLED=false`.
- Edge case: path ber-ID → label pola route.
- Regression: `bun test`, `bun run typecheck`.

## 6. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Cardinality tinggi | Memori membengkak | Pola route (REQ-M04) |
| Dependency `prom-client` | Maintenance | Review lisensi/advisory; saklar konfigurasi |
| `/metrics` publik | Bocor info internal | Dokumentasikan perlindungan production |

## 7. Rollback Plan

Set `METRICS_ENABLED=false`. Revert commit bila perlu. Tidak ada perubahan data.

## 8. Keputusan (selesai)

- [x] Library: `prom-client`.
- [x] Bucket HTTP: `[5,10,25,50,100,250,500,1000,2500,5000]` ms; queue:
      `[50,100,250,500,1000,2500,5000,10000]` ms.
- [x] Proteksi: shared-secret header `x-metrics-token` (aktif bila `METRICS_TOKEN` diisi).
- [x] `/metrics` di-exclude dari rate limiter, request logger, dan metrik sendiri.
- [x] Cakupan: HTTP RED + queue metrics.
