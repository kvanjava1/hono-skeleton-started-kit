# Metrics — Entry Point (Phase 3)

> **Versi:** 1.1.0
> **Terakhir diperbarui:** 2026-09-14
> **Status:** ✅ Selesai
> **Perubahan:** Implementasi selesai

Folder ini adalah **pintu masuk** phase-3 observability: **Metrics**. Tujuannya
menyediakan angka untuk dashboard dan alert (Rate, Errors, Duration).

> Urutan roadmap: phase-1 = logging (selesai) → phase-2 = health →
> **phase-3 = metrics** → phase-4 = tracing.

## Daftar Dokumen

| Folder/File | Peran |
|---|---|
| [`ideas/E5-metrics.md`](./ideas/E5-metrics.md) | Spesifikasi: kondisi saat ini vs rencana |
| [`ideas/cara-kerja-log.md`](./ideas/cara-kerja-log.md) | Penjelasan cara kerja log untuk pemula |
| [`ideas/cara-kerja-metrics.md`](./ideas/cara-kerja-metrics.md) | Penjelasan cara kerja metrics untuk pemula |
| [`references/E7-metrics-codebase.md`](./references/E7-metrics-codebase.md) | Analisis kode yang akan disentuh |
| [`implementations/README.md`](./implementations/README.md) | Ringkasan progress |
| [`implementations/STATUS.md`](./implementations/STATUS.md) | Status ringkas |
| [`implementations/00-overview.md`](./implementations/00-overview.md) | Gambaran umum, requirement, risiko |
| [`implementations/01-metrics.md`](./implementations/01-metrics.md) | Rencana implementasi |
| [`implementations/logs/`](./implementations/logs/) | Journal detail progress |
| [`deployments/`](./deployments/) | Catatan deployment (opsional) |

## Keputusan (final)

- Library: **`prom-client`**.
- `/metrics` di-exclude dari rate limiter, request logger, dan metrik sendiri.
- Label path dinormalisasi ke `{id}`; `/*` → `not_found`.
- Label `kind` (`api`/`web`) pada metrik HTTP untuk memisahkan trafik.
- Cakupan: **HTTP RED + queue metrics**.
- Proteksi: **shared-secret `x-metrics-token`** (aktif bila `METRICS_TOKEN` diisi).
- Saklar: `METRICS_ENABLED` (default `false`).

## Aturan Update

1. Naikkan versi dokumen setiap kali diedit.
2. Update `implementations/STATUS.md` setiap progress.
3. Detail spesifikasi tidak ditulis di sini — taruh di sub-folder.
