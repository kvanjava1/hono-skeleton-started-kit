# 01 — Health & Readiness

> **Versi:** 1.1.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** ✅ Selesai
> **Dependency:** Tidak ada

## Tujuan

Menyediakan endpoint readiness yang memeriksa dependency aktif, tanpa mengubah
liveness yang sudah ada.

## Perubahan

1. **Helper** — tambah `checkDatabaseReadiness()` di `src/database/index.ts`:
   - memanggil `testAll*Connections()` untuk engine yang aktif
     (`configApp.db.*`);
   - tiap pengecekan dibungkus timeout (mis. 2 detik);
   - mengembalikan `{ name, status, latencyMs, error? }[]`;
   - tidak melempar exception (kegagalan menjadi `status: "down"`).
2. **Konstanta route** — tambah `ROUTES.API.HEALTH_READY` di
   `src/configs/routes.config.ts`.
3. **Route** — tambah `GET /api/health/ready` di `src/routes/api/index.ts`:
   - `200` bila semua `up`;
   - `503` bila ada `down`;
   - memakai `successResponse()` / `errorResponse()`.

## File

| File | Jenis |
|---|---|
| `src/database/index.ts` | Ubah |
| `src/configs/routes.config.ts` | Ubah |
| `src/routes/api/index.ts` | Ubah |
| `tests/health.test.ts` | Ubah (tambah test) |

## Test

- `/api/health` tetap `200` dengan bentuk respons lama.
- `/api/health/ready` → `200` saat dependency sehat.
- `/api/health/ready` → `503` saat dependency mati (simulasi).
- Regresi: `bun test`, `bun run typecheck`.

## Risiko

Rendah. Pastikan timeout dan tidak ada exception tak tertangani.

## Definisi Selesai

- [x] `/api/health` tidak berubah.
- [x] `/api/health/ready` 200/503 benar.
- [x] Timeout berfungsi (2 detik).
- [x] `bun test` hijau (57 pass), `bun run typecheck` bersih.
