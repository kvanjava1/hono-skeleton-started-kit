# Cara Kerja Trace (Penjelasan untuk Pemula)

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-14
> **Status:** Rencana (belum diimplementasikan — phase-4 ditunda)

Dokumen ini menjelaskan **apa itu trace dan bagaimana nanti ia bekerja** di
aplikasi ini. Ditulis untuk pemula TypeScript/JavaScript.

> Trace belum dipasang. Dokumen ini menjelaskan konsep + rencananya, supaya saat
> implementasi dimulai semua sudah paham.

---

## 1. Apa itu trace?

Trace = **peta perjalanan satu request** melewati banyak langkah, lengkap dengan
durasi tiap langkah.

Bandingkan tiga pilar:

| | Menjawab | Bentuk |
|---|---|---|
| **Log** | "Apa yang terjadi?" | baris teks per kejadian |
| **Metrics** | "Berapa banyak/cepat?" | angka agregat |
| **Trace** | "Langkah mana yang lambat?" | pohon langkah + durasi |

Contoh pertanyaan yang dijawab trace: *"Request ini total 120ms — 100ms-nya habis
di mana?"*

---

## 2. Istilah inti: trace dan span

- **Trace** — satu perjalanan utuh (satu request). Punya `traceId`.
- **Span** — satu langkah di dalam perjalanan itu. Punya nama, waktu mulai, dan
  durasi.
- Span bisa punya **span anak** (parent → child), membentuk pohon.

Ilustrasi:

```
trace_id = 4bf92f3577b34da6a3ce929d0e0e4736
└─ http.request POST /api/example/cruds        [32ms]   ← span akar
   ├─ middleware.rateLimiter                   [3ms]
   ├─ controller.create                        [24ms]
   │  └─ service.addCrud                       [22ms]
   │     ├─ db.sqlite.insert                   [15ms]   ← paling lama
   │     └─ redis.del                          [2ms]
   └─ response                                 [1ms]
```

Dari pohon ini langsung terlihat: penyebab lambat adalah `db.sqlite.insert`.

---

## 3. Bagaimana nanti ia bekerja (rencana)

### 3a. Inisialisasi

Di startup (`src/index.ts`), sebelum server melayani request:

```ts
startTracing();   // menyalakan OpenTelemetry + exporter
```

Dimatikan lagi saat proses berhenti (`stopTracing()`).

### 3b. Span akar per request

Middleware tracing (mirip `contextMiddleware`) membuat span akar `http.request`
dan menyimpan konteks trace ke "gelang" (AsyncLocalStorage) yang sama:

```ts
requestContext.run({ requestId, traceId, span }, async () => {
  await next();
});
```

### 3c. Span anak di langkah penting

Operasi yang ingin diukur dibungkus:

```ts
await withSpan("db.sqlite.insert", async (span) => {
  span.setAttribute("db.system", "sqlite");
  return await createCrud(input);
});
```

OpenTelemetry juga punya instrumentasi otomatis untuk banyak driver database.

### 3d. Diteruskan ke worker

Worker beda proses, jadi konteks trace **disalin ke payload job** (seperti
`reqId` sekarang), lalu dilanjutkan di worker:

```
request → job payload { requestId, traceparent } → worker → span lanjutan
```

### 3e. Terhubung dengan log

`traceId` disimpan di context, sehingga setiap baris log bisa menyertakan
`traceId`. Hasilnya alur investigasi:

```
Metrics (ada masalah?) → Trace (di langkah mana?) → Log (kenapa tepatnya?)
```

---

## 4. Kenapa ditunda?

- Aplikasi masih **monolith** — manfaat trace jauh lebih besar saat sistem
  dipecah jadi banyak service.
- Butuh beberapa dependency (`@opentelemetry/*`) dan tempat penyimpanan trace
  (Jaeger/Tempo).
- Korelasi dasar sudah tercukupi oleh `reqId` dari phase-1.

Prasyarat sebelum mulai:
- Phase 1–3 stabil (sudah).
- Ada kebutuhan nyata.
- Ada alat penerima trace.

---

## 5. Konfigurasi yang direncanakan

```env
TRACING_ENABLED=false          # saklar; default mati
OTEL_EXPORTER_OTLP_ENDPOINT=   # alamat collector (opsional)
```

Prinsip: **fail-open** — kalau exporter bermasalah, request tetap jalan.

---

## 6. Istilah TS/JS & OpenTelemetry

- **Trace / Span / traceId** — perjalanan / langkah / identitas perjalanan.
- **OpenTelemetry (OTel)** — standar terbuka untuk tracing, metrics, logging.
- **Exporter** — komponen yang mengirim data trace ke collector.
- **Collector** — penerima data trace (mis. Jaeger/Tempo).
- **Instrumentasi otomatis** — span dibuat otomatis untuk library tertentu.
- **Attribute** — informasi tambahan pada span (mis. nama tabel database).

---

## 7. Ringkas

```
startTracing()                     → nyalakan OTel
middleware tracing                 → span akar "http.request"
service/repository dengan withSpan → span anak (db, cache)
payload job                        → teruskan traceId ke worker
log                                → sertakan traceId
        │
        ▼
Collector (Jaeger/Tempo) → bisa dilihat sebagai pohon langkah
```
