# Cara Kerja Log (Penjelasan untuk Pemula)

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-14
> **Status:** Final (menjelaskan implementasi yang sudah ada)

Dokumen ini menjelaskan **bagaimana log bekerja** di aplikasi ini, dari request
masuk sampai menjadi baris teks di file. Ditulis untuk pemula TypeScript/
JavaScript: setiap istilah dijelaskan saat pertama muncul.

> Catatan: fitur logging sendiri diimplementasikan di **phase-1**. Perubahan
> terakhir (waktu request dibagi dengan metrics) terjadi di **phase-3**, karena
> itu penjelasannya ditaruh di folder phase-3.

---

## 1. Apa itu log?

Log = **catatan kejadian**. Satu kejadian = satu baris. Contoh kejadian:
request masuk, request selesai, error, job selesai.

Bedanya dengan metrics:
- **Log** → detail per kejadian ("request ini gagal karena X").
- **Metrics** → angka agregat ("2% request gagal").

---

## 2. Alur: dari request menjadi baris log

```
Request masuk
   │
   ├─[1] requestId()            → buat/baca identitas request (reqId)
   │
   ├─[2] contextMiddleware      → "pasang gelang": { reqId, T0 }
   │
   ├─[3] ...middleware lain...
   │
   ├─[4] requestLoggerMiddleware→ stopwatch siap (baca T0)
   │
   ├─[5] handler                → controller → service → repository
   │       (boleh memanggil logger.info kapan saja)
   │
   ▼ Response selesai
   │
   └─[4] requestLoggerMiddleware→ tulis 1 baris "Request completed"
```

---

## 3. Bagian-bagian yang terlibat

### 3a. `requestId()` — identitas request

Middleware bawaan Hono (`hono/request-id`). Tugasnya:

- Kalau client mengirim header `X-Request-Id`, pakai itu.
- Kalau tidak ada, buat baru (`crypto.randomUUID()`).
- Simpan sebagai `requestId` dan kembalikan di header respons.

Semua log dari request yang sama akan memakai `reqId` ini.

### 3b. `contextMiddleware` — pemasang "gelang"

File: `src/middlewares/common/context.middleware.ts`

```ts
await requestContext.run(
  { requestId, requestStartedAt: Date.now() },
  async () => { await next(); },
);
```

- `requestId` → identitas.
- `requestStartedAt` (T0) → jam masuk, dipakai untuk menghitung durasi.
- `requestContext` = `AsyncLocalStorage`, penyimpanan di RAM yang otomatis
  mengikuti alur request. Fungsi mana pun bisa memanggil `getContext()` untuk
  membacanya **tanpa perlu dikirimi parameter**.

### 3c. `logger` — alat tulisnya

File: `src/utils/logger.util.ts`

`logger` punya 4 level:

| Level | Dipakai untuk |
|---|---|
| `debug` | detail saat development |
| `info` | kejadian normal (request selesai) |
| `warn` | masalah yang masih wajar (data tidak ditemukan) |
| `error` | bug / kegagalan sistem |

Saat dipanggil (`logger.info("...", data)`), logger:

1. Mengambil `reqId` dari context → ditempel ke baris log.
2. Membaca prefix `[NamaModule]` di pesan → jadi field `module`.
3. Menyamarkan data sensitif (password, token, dst.) → jadi `[REDACTED]`.
4. Menulis ke **file** dan **console** (kalau level lolos filter).

### 3d. `requestLoggerMiddleware` — pemicu log request

File: `src/middlewares/common/logger.middleware.ts`

```ts
const start = getContext()?.requestStartedAt ?? Date.now();
await next();
logger.info("[Http] Request completed", { method, path, status, durationMs, ip });
```

- Ambil T0 dari context.
- Setelah handler selesai, hitung `durationMs = Date.now() - start`.
- Tulis satu baris log.

### 3e. `errorHandler` — log khusus error

File: `src/middlewares/common/errorHandler.ts`

- Error yang **diharapkan** (mis. data tidak ditemukan) → `logger.warn`.
- Bug tak terduga → `logger.error` + stack trace.
- Di production, pesan error di-mask (disembunyikan) dari response.

---

## 4. Bentuk satu baris log

```json
{
  "time": "2026-09-14T08:35:24.000Z",
  "level": "INFO",
  "service": "app",
  "reqId": "f7ed0dc3-5bd1-4db4-8a01-a5c8fb90fc5c",
  "module": "Http",
  "msg": "Request completed",
  "data": {
    "method": "PUT",
    "path": "/api/example/cruds/1",
    "status": 200,
    "durationMs": 26,
    "ip": "unknown"
  }
}
```

Arti tiap field:

| Field | Arti |
|---|---|
| `time` | waktu kejadian (ISO UTC) |
| `level` | tingkat kepentingan |
| `service` | proses mana (`app`, `queue`, `cli`) |
| `reqId` | identitas request (dari context) |
| `module` | dari prefix `[Http]` pada pesan |
| `msg` | pesan kejadian |
| `data` | detail tambahan (objek) |

---

## 5. Di mana file log disimpan?

```
storages/logs/<service>/<tanggal>/
├── debug.jsonl
├── info.jsonl
├── warning.jsonl
└── errors.jsonl
```

- Format **JSON Lines** (`.jsonl`) = satu baris = satu JSON.
- Dipisah per level supaya mudah dibaca.
- Retensi diatur `LOG_RETENTION_DAYS` (folder lama dihapus otomatis).

---

## 6. `LOG_LEVEL` — filter

```env
LOG_LEVEL=info
```

Hanya log dengan level **≥** nilai ini yang ditulis. Contoh `LOG_LEVEL=warn`:
`warn` dan `error` ditulis; `info` dan `debug` diabaikan. Nilai tidak valid →
fallback ke `info`.

---

## 7. Redaksi — menyembunyikan data sensitif

Key sensitif otomatis diganti `[REDACTED]` sebelum ditulis:
`password`, `passwd`, `token`, `authorization`, `secret`, `cookie`, `apikey`,
`creditcard` — termasuk di dalam objek bersarang dan array.

---

## 8. Perubahan di phase-3: satu waktu untuk log & metrics

Sebelumnya log dan metrics mengukur dari titik berbeda → durasi bisa beda
(mis. log 26ms, metrics 32ms). Sekarang keduanya memakai **T0 yang sama** dari
context:

```
contextMiddleware → T0 = Date.now()
        │
        ├─ logger  → durationMs = now - T0
        └─ metrics → duration   = now - T0
```

Hasil: angkanya identik, dan lebih akurat karena menghitung dari awal request.

---

## 9. Istilah TS/JS yang muncul

- **Middleware** — fungsi `(c, next)` yang menyisip di alur; `next()` = lanjut.
- **async/await** — menunggu operasi selesai tanpa memblokir program.
- **AsyncLocalStorage** — penyimpanan RAM yang mengikuti alur async ("gelang").
- **Interface** — cetakan bentuk data (khusus TypeScript).
- **JSON** — format data berbentuk `{ "key": "value" }`.
- **Environment variable** — pengaturan dari file `.env`.

---

## 10. Ringkas

```
requestId()          → identitas
contextMiddleware    → simpan identitas + T0 di RAM
logger               → alat tulis (otomatis menempel reqId)
requestLogger        → menulis log saat request selesai
errorHandler         → menulis log saat error
        │
        ▼
storages/logs/<service>/<tanggal>/<level>.jsonl
```
