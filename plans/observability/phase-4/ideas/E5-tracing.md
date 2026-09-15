# [E5] — Tracing: Kondisi Saat Ini vs Rencana

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** Draft (ditunda)

Dokumen ini menjelaskan kondisi tracing saat ini dan rencananya.

---

## 1. Kondisi Saat Ini

- **Belum ada tracing.**
- Yang sudah ada sebagai fondasi:
  - `reqId` per request (`hono/request-id`) dan konteks request via
    `AsyncLocalStorage` (`src/utils/context.util.ts`).
  - Logger yang otomatis menyertakan `reqId` di setiap log
    (`src/utils/logger.util.ts`).
- Artinya: kita bisa melacak **satu request** lewat log, tetapi **tidak** bisa
  melihat pembagian waktu antar langkah secara otomatis (perlu baca log manual).

---

## 2. Masalah

- Untuk tahu "langkah mana yang lambat", saat ini harus menebak atau menambah
  log manual di banyak tempat.
- Tidak ada hubungan orangtua–anak antar operasi (mis. request → query DB →
  cache).
- Tidak ada standar untuk dikonsumsi alat visualisasi (Jaeger, Tempo).

---

## 3. Kondisi yang Direncanakan

Setelah tracing dipasang:

- Setiap request menghasilkan satu **trace** berisi beberapa **span** (langkah).
- Setiap span punya nama, waktu mulai, dan durasi.
- Span membentuk pohon: `http.request` → `controller.*` → `service.*` →
  `db.*` / `redis.*`.
- `traceId` dikaitkan dengan `reqId` supaya bisa pindah dari trace ke log.
- Bisa divisualisasikan di alat trace (mis. Jaeger).

Ilustrasi:

```text
trace_id=4bf92f3577b34da6a3ce929d0e0e4736
└─ http.request POST /api/example/cruds [14ms]
   ├─ middleware.rateLimiter [3ms]
   ├─ controller.create [10ms]
   │  └─ service.addCrud [9ms]
   │     ├─ db.sqlite.insert [7ms]
   │     └─ redis.del [1ms]
   └─ response [1ms]
```

---

## 4. Langkah Migrasi

1. Tambahkan konfigurasi `TRACING_ENABLED` (default `false`).
2. Pasang OpenTelemetry API + SDK + exporter.
3. Inisialisasi tracing di startup (`src/index.ts`), sebelum route diproses.
4. Buat span di middleware, service, dan repository.
5. Teruskan konteks trace ke job queue (via payload/context).
6. Sediakan alat penerima trace (Jaeger/Tempo) di environment.

---

## 5. Rollback Plan

- Matikan tracing lewat `TRACING_ENABLED=false` → aplikasi kembali berjalan tanpa
  tracing, tanpa deploy ulang.
- Karena bersifat aditif dan tidak mengubah data, rollback = revert commit.
