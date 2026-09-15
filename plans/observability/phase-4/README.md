# Tracing — Entry Point (Phase 4)

> **Versi:** 1.1.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Ditunda (belum ada implementasi)
> **Perubahan:** Dipindah dari phase-2 ke phase-4 sesuai urutan roadmap

Folder ini adalah **pintu masuk** pekerjaan **tracing** untuk aplikasi
`hono-multi-db-api`. Tracing adalah pilar observability ketiga: melihat jejak
satu request melewati banyak langkah beserta durasi tiap langkah.

> Ini adalah **phase-4** dari `plans/observability/`. Phase-1 = logging,
> phase-2 = health & readiness, phase-3 = metrics.

## Daftar Dokumen

| Folder/File | Peran |
|---|---|
| [`ideas/E5-tracing.md`](./ideas/E5-tracing.md) | Spesifikasi: kondisi saat ini vs rencana tracing |
| [`ideas/cara-kerja-trace.md`](./ideas/cara-kerja-trace.md) | Penjelasan cara kerja trace untuk pemula |
| [`references/E7-tracing-codebase.md`](./references/E7-tracing-codebase.md) | Analisis kode yang akan disentuh tracing |
| [`implementations/README.md`](./implementations/README.md) | Ringkasan progress |
| [`implementations/STATUS.md`](./implementations/STATUS.md) | Status ringkas |
| [`implementations/00-overview.md`](./implementations/00-overview.md) | Gambaran umum, requirement, risiko |
| [`implementations/01-tracing-setup.md`](./implementations/01-tracing-setup.md) | Rencana implementasi tracing |
| [`implementations/logs/`](./implementations/logs/) | Journal detail progress |
| [`deployments/`](./deployments/) | Catatan deployment (opsional) |

## Mengapa Ditunda

- Aplikasi masih **monolith**; tracing paling berguna pada sistem multi-service.
- Butuh beberapa dependency (`@opentelemetry/*`) dan tempat penyimpanan trace
  (Jaeger/Tempo).
- Korelasi dasar sudah tercukupi oleh `reqId` dari phase-1.

Tracing dikerjakan setelah phase-1 sampai phase-3 stabil dan ada kebutuhan
nyata.

## Aturan Update

1. Naikkan versi dokumen setiap kali diedit.
2. Update `implementations/STATUS.md` setiap progress.
3. Detail spesifikasi tidak ditulis di sini — taruh di sub-folder.
