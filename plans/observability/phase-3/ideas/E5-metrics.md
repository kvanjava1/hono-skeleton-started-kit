# [E5] — Metrics: Kondisi Saat Ini vs Rencana

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Final (terimplementasi)

## 1. Kondisi Saat Ini

- **Belum ada metrics.**
- Yang tersedia sebagai bahan mentah: log request terstruktur dari phase-1
  (`method`, `path`, `status`, `durationMs`) — tetapi log tidak efisien untuk
  diagregasi jangka panjang.
- Rate limiter sudah menulis header `X-RateLimit-*`, tapi bukan metrik.

## 2. Masalah

- Tidak bisa menjawab cepat: "berapa request/detik?", "berapa error rate?",
  "berapa latency P95?".
- Tidak bisa membuat alert saat error/latency naik.
- Log terlalu besar/mahal untuk dijadikan sumber grafik jangka panjang.

## 3. Kondisi yang Direncanakan

- Endpoint `GET /metrics` (format Prometheus), dapat dimatikan lewat
  `METRICS_ENABLED=false` (maka `404`).
- Metrik RED:
  - **Rate** → `http_requests_total{method,path,status}`
  - **Errors** → turunan dari `status`
  - **Duration** → `http_request_duration_ms` (histogram, ada `_bucket{le=...}`)
- Label `path` memakai **pola route** (mis. `/api/example/cruds/{id}`), bukan
  path mentah, agar jumlah label tidak meledak.

Contoh:

```text
http_requests_total{method="POST",path="/api/example/cruds",status="201"} 1
http_request_duration_ms_bucket{method="POST",path="/api/example/cruds",le="25"} 1
http_request_duration_ms_sum{method="POST",path="/api/example/cruds"} 15
http_request_duration_ms_count{method="POST",path="/api/example/cruds"} 1
```

## 4. Langkah Migrasi

1. Putuskan opsi (a) `prom-client` atau (b) buat sendiri.
2. Tambah konfigurasi `METRICS_ENABLED`.
3. Buat modul metrik + middleware pengukur.
4. Tambah route `/metrics`.
5. Tambah test.

## 5. Rollback Plan

Set `METRICS_ENABLED=false`. Tidak ada perubahan data; revert commit bila perlu.
