# 00 — Overview Tracing

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Draft (ditunda)

## 1. Tujuan

Melihat jejak satu request melewati banyak langkah (middleware, controller,
service, repository, database, queue), lengkap dengan durasi tiap langkah.

## 2. Requirements

### Functional

- **REQ-T01** — Setiap request menghasilkan satu trace dengan root span
  `http.request`.
- **REQ-T02** — Operasi penting (DB, cache, job) menghasilkan span anak.
- **REQ-T03** — `traceId` dikaitkan dengan `reqId` agar bisa pindah trace ↔ log.
- **REQ-T04** — Konteks trace diteruskan ke job queue.
- **REQ-T05** — Tracing dapat dinyalakan/dimatikan lewat `TRACING_ENABLED`.

### Non-Functional

- **NFR-T01** — Overhead minimal saat aktif; nol saat nonaktif.
- **NFR-T02** — Tidak ada secret/PII di atribut span.
- **NFR-T03** — Sampling rate dapat diatur.
- **NFR-T04** — Kegagalan exporter tidak boleh mematikan aplikasi.

### Out of Scope

- Dashboard & alerting (itu ranah metrics).
- Mengubah skema database.

## 3. Desain

```text
startTracing()  →  OpenTelemetry SDK + exporter
        │
request masuk
        │
middleware tracing  →  root span "http.request"
        │
controller / service / repository  →  span anak
        │
enqueue job  →  sertakan trace context (traceparent)
        │
worker  →  lanjutkan trace, span baru
```

## 4. File yang Akan Disentuh

| File | Jenis |
|---|---|
| `src/configs/app.config.ts` | Ubah (tracingEnabled) |
| `src/utils/context.util.ts` | Ubah (traceId) |
| `src/middlewares/common/context.middleware.ts` | Ubah (root span) |
| `src/middlewares/common/index.ts` | Ubah (pasang middleware tracing) |
| `src/utils/logger.util.ts` | Ubah (traceId/spanId) |
| `src/index.ts` | Ubah (init & shutdown tracing) |
| `src/utils/tracing.util.ts` | **Baru** |
| `src/middlewares/common/tracing.middleware.ts` | **Baru** |
| `package.json` | Ubah (OpenTelemetry) |

## 5. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Overhead performa | Aplikasi melambat | Sampling, bisa dimatikan |
| Dependency bertambah banyak | Maintenance | Aktifkan hanya saat dibutuhkan |
| Exporter gagal | Trace hilang / error | Jangan blok request; fail-open |
| Data sensitif di span | Kebocoran | Batasi atribut; jangan log body |

## 6. Rollback Plan

Set `TRACING_ENABLED=false`. Tidak ada perubahan data; revert commit bila perlu.

## 7. Pertanyaan Terbuka

- [ ] Exporter/collector mana? (Jaeger, Tempo, OTLP endpoint?)
- [ ] Sampling rate awal?
- [ ] Aktif di production atau staging saja?
