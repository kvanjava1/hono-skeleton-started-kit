# STATUS — Tracing (Phase 4)

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11

| Item | Status | Dependency baru | Verifikasi |
|---|---|---|---|
| Tracing setup | ⏸️ Ditunda | Ya (`@opentelemetry/*`) | Belum |

Keterangan: ⏳ Direncanakan · 🚧 Sedang dikerjakan · ✅ Selesai · ⏸️ Ditunda ·
❓ Butuh keputusan.

## Prasyarat

- [ ] Phase-1 (logging, health, metrics) selesai dan stabil.
- [ ] Ada kebutuhan nyata (mis. mulai dipecah jadi beberapa service).
- [ ] Ada alat penerima trace (Jaeger/Tempo).

## Blocker / Keputusan Tertunda

- [ ] Pilihan exporter/collector.
- [ ] Apakah tracing aktif di production atau hanya staging.
- [ ] Sampling rate (berapa persen request yang di-trace).

## Riwayat

| Tanggal | Perubahan |
|---|---|
| 2026-09-11 | Struktur awal dibuat, tracing masih ditunda |
