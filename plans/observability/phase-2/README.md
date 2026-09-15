# Health & Readiness — Entry Point (Phase 2)

> **Versi:** 1.1.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** ✅ Selesai
> **Perubahan:** Implementasi selesai

Folder ini adalah **pintu masuk** phase-2 observability: **Health & Readiness**.
Tujuannya agar orchestrator/load balancer tahu apakah aplikasi siap menerima
trafik.

> Urutan roadmap: **phase-1 = logging** (selesai) → **phase-2 = health** →
> phase-3 = metrics → phase-4 = tracing.

## Daftar Dokumen

| Folder/File | Peran |
|---|---|
| [`ideas/E5-health.md`](./ideas/E5-health.md) | Spesifikasi: kondisi saat ini vs rencana |
| [`references/E7-health-codebase.md`](./references/E7-health-codebase.md) | Analisis kode yang akan disentuh |
| [`implementations/README.md`](./implementations/README.md) | Ringkasan progress |
| [`implementations/STATUS.md`](./implementations/STATUS.md) | Status ringkas |
| [`implementations/00-overview.md`](./implementations/00-overview.md) | Gambaran umum, requirement, risiko |
| [`implementations/01-health.md`](./implementations/01-health.md) | Rencana implementasi |
| [`implementations/logs/`](./implementations/logs/) | Journal detail progress |
| [`deployments/`](./deployments/) | Catatan deployment (opsional) |

## Ringkasan

- `GET /api/health` (liveness) **tetap** seperti sekarang.
- Tambah `GET /api/health/ready` (readiness) yang mengecek dependency aktif
  (SQLite/Redis) dengan timeout → `200` siap / `503` belum siap.
- Tanpa dependency baru.

## Aturan Update

1. Naikkan versi dokumen setiap kali diedit.
2. Update `implementations/STATUS.md` setiap progress.
3. Detail spesifikasi tidak ditulis di sini — taruh di sub-folder.
