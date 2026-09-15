# [E7] — Analisis Codebase untuk Health & Readiness

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Final

Analisis kode yang akan disentuh phase-2.

## 1. Health Sekarang — `src/routes/api/index.ts`

```ts
apiRoutes.get(ROUTES.API.HEALTH, (c) => {
  return successResponse(c, MESSAGES.HEALTH_OK, {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
```

- Hanya `uptime` + `timestamp`.
- Tidak memeriksa dependency.
- **Rencana**: pertahankan, tambah route `/api/health/ready` di file yang sama.

## 2. Konstanta Route — `src/configs/routes.config.ts`

- Berisi `ROUTES.API.HEALTH`.
- **Rencana**: tambah `ROUTES.API.HEALTH_READY`.

## 3. Koneksi Database — `src/database/index.ts`

- `connectAllDatabases()` mengoneksikan & menguji hanya engine yang aktif.
- Tersedia `testAll*Connections()` per engine
  (`testAllSqliteConnections`, `testAllRedisConnections`, dst.) yang bisa
  dipakai ulang.
- **Rencana**: tambah `checkDatabaseReadiness()` yang memanggil `test*` untuk
  engine aktif, dibungkus timeout, dan mengembalikan
  `{ name, status, latencyMs, error? }[]` tanpa melempar exception.

## 4. Response — `src/utils/response.util.ts`

- Gunakan `successResponse()` / `errorResponse()`.
- Untuk `503`, pakai `errorResponse` atau `successResponse` dengan status
  kustom? Ikuti kontrak: `status`, `message`, `data`.

## 5. Config — `src/configs/app.config.ts`

- `configApp.db.*` menentukan engine mana yang aktif.
- Readiness hanya memeriksa engine yang `true`.

## 6. Test — `tests/health.test.ts`

- Sudah ada test `/api/health` (200 + uptime + timestamp) dan 404.
- **Rencana**: tambah test `/api/health/ready`; jangan ubah test lama.

## 7. Konvensi

- Middleware, route, dan response mengikuti pola yang ada.
- Jangan mengakses `process.env` langsung di route; gunakan config.
- Endpoint readiness tidak boleh menggantung (wajib timeout).
