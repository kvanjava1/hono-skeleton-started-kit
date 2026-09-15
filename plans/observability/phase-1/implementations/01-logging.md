# 01 — Logging & Correlation Hardening

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** ✅ Selesai
> **Dependency:** Tidak ada

## Tujuan

Membuat log lebih rapi, aman, dan dapat diolah mesin, tanpa menambah dependency.

## Perubahan

1. **`LOG_LEVEL`** — tambah `logLevel` pada `ConfigApp`
   (`src/configs/app.config.ts`) via `getEnv("LOG_LEVEL", "info")`. Logger
   (`src/utils/logger.util.ts`) melewati log di bawah level tersebut.
2. **Redaksi** — pada `formatDataForJson` (`logger.util.ts`), ganti nilai key
   sensitif menjadi `"[REDACTED]"`. Key awal: `password`, `passwd`, `token`,
   `authorization`, `secret`, `cookie`, `apiKey`, `creditCard`. Harus rekursif
   untuk objek bersarang.
3. **Log request terstruktur** — ubah `requestLoggerMiddleware`
   (`src/middlewares/common/logger.middleware.ts`) menjadi satu baris:
   `logger.info("[Http] Request completed", { method, path, status, durationMs, ip })`.
4. **Log job** — di `src/queues/base.queue.ts`, catat
   `logger.info("[Queue] Job completed", { queue: name, jobId: job.id })` dan
   serupa untuk `failed` dengan `error`.
5. **Propagasi `reqId` ke job** — sertakan `reqId` di payload job
   (`src/jobs/example/crudCreate.job.ts`) agar worker bisa mencatat log dengan
   `reqId` yang sama seperti request asalnya.

## File

| File | Jenis |
|---|---|
| `src/configs/app.config.ts` | Ubah |
| `src/utils/logger.util.ts` | Ubah |
| `src/middlewares/common/logger.middleware.ts` | Ubah |
| `src/queues/base.queue.ts` | Ubah |

## Test

- Unit: log di bawah `LOG_LEVEL` tidak ditulis; redaksi menyamarkan key
  sensitif termasuk objek bersarang.
- Regresi: `bun test`, `bun run typecheck`.

## Risiko

Rendah. Perubahan bersifat aditif; field log lama dipertahankan.

## Definisi Selesai

- [ ] `LOG_LEVEL` berfungsi dan tidak valid → fallback `info`.
- [ ] Redaksi teruji.
- [ ] Log request & job terstruktur.
- [ ] `reqId` diteruskan ke payload job.
- [ ] `bun test` hijau, `bun run typecheck` bersih.
