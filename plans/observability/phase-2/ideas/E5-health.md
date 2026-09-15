# [E5] — Health & Readiness: Kondisi Saat Ini vs Rencana

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Final (terimplementasi)

## 1. Kondisi Saat Ini

- `GET /api/health` (`src/routes/api/index.ts`) mengembalikan `uptime` dan
  `timestamp` — hanya menandakan **proses hidup** (liveness).
- Tidak ada pengecekan dependency.
- Saat startup, `connectAllDatabases()` (`src/database/index.ts`) memang menguji
  koneksi engine yang aktif, tapi hanya sekali di awal.

## 2. Masalah

- Load balancer/orchestrator tidak bisa membedakan "proses hidup" vs "dependency
  siap". Bisa saja proses hidup tapi database/Redis mati, sehingga request tetap
  diarahkan dan gagal.
- Tidak ada cara cepat untuk memeriksa kesehatan dependency saat runtime.

## 3. Kondisi yang Direncanakan

- **Liveness** tetap: `GET /api/health` (tidak berubah).
- **Readiness baru**: `GET /api/health/ready` memeriksa dependency yang **aktif**
  (sesuai toggle `DB_*_ENABLED`):
  - `200` bila semua `up`.
  - `503` bila ada yang `down`.
  - Tiap pengecekan punya `latencyMs` dan dibatasi timeout.

Contoh respons siap:

```json
{
  "status": "success",
  "message": "Ready",
  "data": {
    "checks": [
      { "name": "sqlite1", "status": "up", "latencyMs": 1 },
      { "name": "redis1", "status": "up", "latencyMs": 2 }
    ]
  }
}
```

## 4. Langkah Migrasi

1. Tambah helper `checkDatabaseReadiness()` di `src/database/index.ts`.
2. Tambah konstanta route di `src/configs/routes.config.ts`.
3. Tambah route `GET /api/health/ready` di `src/routes/api/index.ts`.
4. Tambah test integration (200/503).

## 5. Rollback Plan

Tidak ada perubahan data. Rollback = revert commit. Endpoint `/api/health` lama
tidak tersentuh.
