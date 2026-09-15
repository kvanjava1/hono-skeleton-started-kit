# [E5] — Observability: Kondisi Saat Ini vs Rencana

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Final (terimplementasi)

Dokumen ini menjelaskan **apa yang ada sekarang**, **masalahnya**, dan **kondisi
yang diinginkan** setelah perbaikan observability.

---

## 1. Kondisi Saat Ini

Aplikasi `hono-multi-db-api` sudah memiliki sebagian fondasi observability:

- **Logs terstruktur** (JSON Lines) ke file dan console —
  `src/utils/logger.util.ts`.
- **Request ID** per request dan konteks request via `AsyncLocalStorage` —
  `src/middlewares/common/context.middleware.ts`, `src/utils/context.util.ts`.
- **Log request** (method, path, status, durasi) —
  `src/middlewares/common/logger.middleware.ts`.
- **Log error** dengan masking saat production —
  `src/middlewares/common/errorHandler.ts`.
- **Health check dasar** — `GET /api/health` (uptime + timestamp).
- **Tes koneksi database** saat startup — `src/database/index.ts`.
- **Log job queue** (completed/failed) — `src/queues/base.queue.ts`.

Yang **belum** ada: **metrics** dan **traces**.

---

## 2. Masalah

1. **Log tidak sepenuhnya terstruktur** — `method`, `path`, `status`, dan
   durasi masih digabung ke dalam teks pesan, sehingga sulit diolah otomatis.
2. **Tidak ada level log** — semua level selalu ditulis; berisik di production
   dan tidak bisa menaikkan detail saat investigasi tanpa deploy.
3. **Tidak ada redaksi** — data sensitif berpotensi bocor ke file log.
4. **Health tidak merepresentasikan kesiapan** — orchestrator tidak bisa tahu
   apakah dependency (database/Redis) benar-benar siap.
5. **Tidak ada metrics** — tidak bisa membuat grafik atau alert (error rate,
   latency).
6. **Tidak ada traces** — sulit mengetahui langkah mana yang lambat.

---

## 3. Kondisi yang Direncanakan

Setelah perbaikan, aplikasi akan memiliki:

| Area | Kondisi yang diinginkan |
|---|---|
| Level log | Difilter oleh `LOG_LEVEL` |
| Data sensitif | Disamarkan (redaksi) sebelum ditulis |
| Log request | Field JSON terpisah: `method`, `path`, `status`, `durationMs` |
| Log job | Field `jobId` dan `queue` terpisah |
| Health | Liveness (`/api/health`) + readiness (`/api/health/ready`) |
| Metrics | `GET /metrics` (format Prometheus), metrik RED |
| Traces | Ditunda (phase-4) |

---

## 4. Langkah Migrasi

1. **phase-1** — rapikan logging: `LOG_LEVEL`, redaksi, log request terstruktur,
   log job. Tanpa dependency baru.
2. **phase-2** — tambah `GET /api/health/ready`.
3. **phase-3** — tambah `GET /metrics` + middleware RED (butuh keputusan
   dependency).
4. **Phase-2** — tracing (ditunda).

Setiap fase berdiri sendiri dan dirilis terpisah.

---

## 5. Rollback Plan

- Tidak ada perubahan skema database, jadi rollback = **revert commit per fase**.
- Metrics dapat dimatikan lewat `METRICS_ENABLED=false`.
- `LOG_LEVEL` dapat diubah lewat `.env` tanpa deploy ulang.
