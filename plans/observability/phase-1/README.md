# Logging & Correlation — Entry Point (Phase 1)

> **Versi:** 2.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** ✅ Selesai
> **Perubahan:** Dipersempit ke logging; health/metrics/tracing pindah ke phase-2/3/4

Folder ini adalah **pintu masuk** phase-1 observability: **Logging &
Correlation**. Fase ini sudah selesai diimplementasikan.

> **Urutan roadmap:**
> **phase-1 = logging (selesai)** → phase-2 = health → phase-3 = metrics →
> phase-4 = tracing.

## Daftar Dokumen

| Folder/File | Peran |
|---|---|
| [`ideas/E5-observability.md`](./ideas/E5-observability.md) | Spesifikasi umum observability (umbrella) |
| [`ideas/simulasi-hasil-akhir.md`](./ideas/simulasi-hasil-akhir.md) | Simulasi flow hasil akhir (logs, metrics, traces, health) |
| [`references/E7-observability-codebase.md`](./references/E7-observability-codebase.md) | Analisis kode existing terkait observability |
| [`implementations/README.md`](./implementations/README.md) | Ringkasan progress |
| [`implementations/STATUS.md`](./implementations/STATUS.md) | Status ringkas |
| [`implementations/00-overview.md`](./implementations/00-overview.md) | Gambaran umum, requirement, risiko |
| [`implementations/01-logging.md`](./implementations/01-logging.md) | Rencana logging & correlation |
| [`implementations/logs/`](./implementations/logs/) | Journal detail progress |
| [`deployments/`](./deployments/) | Catatan deployment (opsional) |

## Fase Lain

| Folder | Isi |
|---|---|
| [`../phase-2/`](../phase-2/) | Health & readiness |
| [`../phase-3/`](../phase-3/) | Metrics |
| [`../phase-4/`](../phase-4/) | Tracing (ditunda) |

## Aturan Update

1. Naikkan versi dokumen setiap kali diedit.
2. Update `implementations/STATUS.md` setiap progress.
3. Detail spesifikasi **tidak** ditulis di sini — taruh di sub-folder.
