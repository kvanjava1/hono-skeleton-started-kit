# Observability — Index

> **Versi:** 1.4.0
> **Terakhir diperbarui:** 2026-09-15
> **Status:** Phase 1–3 selesai, phase 4 ditunda

Pintu masuk semua pekerjaan observability untuk `hono-multi-db-api`.

## Roadmap

```text
phase-1 ✅  Logging & Correlation
    │
    ▼
phase-2 ✅  Health & Readiness
    │
    ▼
phase-3 ✅  Metrics (HTTP RED + queue)
    │
    ▼
phase-4 ⏸️  Tracing (OpenTelemetry, ditunda)
```

| Phase | Isi | Status | Dependency baru | Folder |
|---|---|---|---|---|
| 1 | Logging & correlation | ✅ Selesai | Tidak | [`phase-1/`](./phase-1/) |
| 2 | Health & readiness | ✅ Selesai | Tidak | [`phase-2/`](./phase-2/) |
| 3 | Metrics | ✅ Selesai | `prom-client` | [`phase-3/`](./phase-3/) |
| 4 | Tracing | ⏸️ Ditunda | Ya | [`phase-4/`](./phase-4/) |

## Struktur Tiap Phase

Setiap folder phase mengikuti konvensi yang sama:

```text
phase-N/
├── README.md            ← entry point
├── ideas/               ← E5: kondisi saat ini vs rencana
├── references/          ← E7: analisis kode existing
├── implementations/     ← rencana + progress + journal
└── deployments/         ← catatan deployment (opsional)
```

## Penjelasan untuk Pemula

Dokumen "cara kerja" yang menjelaskan konsep + alur kode dengan bahasa sederhana:

| Dokumen | Isi |
|---|---|
| [`phase-3/ideas/cara-kerja-log.md`](./phase-3/ideas/cara-kerja-log.md) | Dari request sampai baris log |
| [`phase-3/ideas/cara-kerja-metrics.md`](./phase-3/ideas/cara-kerja-metrics.md) | Counter, histogram, label, `/metrics` |
| [`phase-4/ideas/cara-kerja-trace.md`](./phase-4/ideas/cara-kerja-trace.md) | Konsep trace/span (masih rencana) |

## Catatan Penting

- **Queue metrics belum ter-expose.** Worker berjalan di proses terpisah tanpa
  HTTP server, jadi `queue_jobs_total` / `queue_job_duration_ms` tidak bisa
  di-scrape dari `/metrics` proses API. Detail & opsi perbaikan ada di
  [`phase-3/implementations/logs/metrics.md`](./phase-3/implementations/logs/metrics.md)
  bagian *Known Issue*.

## Cara Membaca

1. Mulai dari tabel roadmap di atas.
2. Buka folder phase yang relevan, lalu baca `README.md`-nya.
3. Detail teknis ada di `implementations/`; journal hasil eksekusi ada di
   `implementations/logs/`.
