# Cara Kerja Metrics (Penjelasan untuk Pemula)

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-14
> **Status:** Final (menjelaskan implementasi yang sudah ada)

Dokumen ini menjelaskan **bagaimana metrics bekerja** di aplikasi ini, dari
request masuk sampai menjadi angka di endpoint `/metrics`. Ditulis untuk pemula
TypeScript/JavaScript.

---

## 1. Apa itu metrics?

Metrics = **angka agregat** tentang aplikasi. Bukan catatan per kejadian, tapi
hitungan yang terus bertambah.

Bedanya dengan log:

| | Log | Metrics |
|---|---|---|
| Bentuk | 1 baris per kejadian | angka yang dijumlahkan |
| Menjawab | "request ini kenapa?" | "berapa banyak/cepat?" |
| Contoh | `{"reqId":"...","status":404}` | `http_requests_total{status="404"} 7` |
| Simpan lama | mahal (file membesar) | murah (memori terbatas) |

Tiga metrik dasar untuk API disebut **RED**:
- **R**ate — jumlah request
- **E**rrors — jumlah yang gagal
- **D**uration — lama request

---

## 2. Alur: dari request menjadi angka

```
Request masuk
   │
   ├─ contextMiddleware   → pasang "gelang": { reqId, T0 }
   │
   ├─ metricsMiddleware   → baca T0, mulai stopwatch
   │     │
   │     └─ handler selesai
   │           │
   │           └─ metricsMiddleware mencatat:
   │                http_requests_total.inc(...)              ← tambah 1
   │                http_request_duration_ms.observe(...)     ← catat durasi
   │
   ▼
Registry (di memori)  ← tempat angka berkumpul
   │
   ▼ (saat ada yang memanggil)
GET /metrics → render angka menjadi teks Prometheus
```

Penting: **metrics tidak membaca log**. Ia menghitung sendiri saat request
berjalan, lalu menyimpan hasilnya di memori.

---

## 3. Bagian-bagian yang terlibat

### 3a. Konfigurasi

File: `src/configs/app.config.ts`

```env
METRICS_ENABLED=true    # saklar utama; default false
METRICS_TOKEN=          # opsional, kunci rahasia
```

### 3b. Registry & definisi metrik

File: `src/utils/metrics.util.ts`

```ts
export const registry = new Registry();                 // wadah angka di memori

export const httpRequestsTotal = new Counter({          // penghitung
  name: "http_requests_total",
  labelNames: ["method", "path", "status"],
  registers: [registry],
});

export const httpRequestDurationMs = new Histogram({    // distribusi durasi
  name: "http_request_duration_ms",
  labelNames: ["method", "path"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [registry],
});
```

### 3c. Middleware pengukur

File: `src/middlewares/common/metrics.middleware.ts`

```ts
const start = getContext()?.requestStartedAt ?? Date.now();   // T0 dari context

try {
  await next();
  status = c.res.status;
} finally {
  const path = normalizeRoutePath(c.req.routePath);
  httpRequestsTotal.inc({ method, path, status: String(status) });
  httpRequestDurationMs.observe({ method, path }, Date.now() - start);
}
```

`try/finally` memastikan metrik tetap tercatat walau handler error.

### 3d. Endpoint `/metrics`

File: `src/routes/api/metrics/metrics.router.ts`

- `METRICS_ENABLED=false` → balas `404`.
- `METRICS_TOKEN` diisi tapi header `x-metrics-token` salah → balas `401`.
- Selain itu → render registry jadi teks Prometheus.

### 3e. Metrik queue

File: `src/queues/base.queue.ts`

```ts
worker.on("completed", (job) => {
  queueJobsTotal.inc({ queue: name, status: "completed" });
  queueJobDurationMs.observe({ queue: name }, job.finishedOn - job.processedOn);
});
worker.on("failed", () => {
  queueJobsTotal.inc({ queue: name, status: "failed" });
});
```

---

## 4. Counter vs Histogram

**Counter** — hanya bisa naik. Untuk "berapa banyak".

```
http_requests_total{method="GET",path="/api/health",status="200",kind="api"} 42
```

**Histogram** — mengelompokkan nilai ke "ember" (bucket). Untuk "berapa lama".

```
http_request_duration_ms_bucket{le="25"} 40
http_request_duration_ms_bucket{le="50"} 42
http_request_duration_ms_sum 860
http_request_duration_ms_count 42
```

Cara membaca histogram:
- `le` = "less than or equal" (≤). Bucket `le="25"` = request ≤ 25ms.
- Bucket bersifat **kumulatif**: request 32ms masuk ke `le=50` **dan** semua
  bucket di atasnya (`le=100`, `le=250`, …, `+Inf`).
- Rentang 25–50ms = `le=50` − `le=25`.
- `_count` = jumlah pengamatan; `_sum` = total durasi.
- Rata-rata = `_sum / _count`.
- P95 dicari dari bucket tempat hitungan kumulatif mencapai 95% dari `_count`.

---

## 5. Cardinality & normalisasi path

Masalah: `/cruds/123` dan `/cruds/456` itu dua path berbeda. Kalau dibiarkan,
jumlah kombinasi label bisa meledak dan memori bengkak.

Solusi: `normalizeRoutePath()` mengubah angka menjadi pola:

```
/api/example/cruds/123  →  /api/example/cruds/{id}
/route/tidak/ada        →  not_found
```

Ini disebut menjaga **cardinality** tetap rendah.

---

## 5b. Label `kind` — memisahkan web dan API

Setiap request diberi label `kind`:

| Path request | `kind` |
|---|---|
| diawali `/api` | `api` |
| selain itu (halaman web/SSR) | `web` |

Contoh:

```
http_requests_total{method="GET",path="/",status="200",kind="web"} 12
http_requests_total{method="GET",path="/api/health",status="200",kind="api"} 34
```

Gunanya: bisa membuat grafik/alert **terpisah** antara trafik web dan API.
Logika klasifikasinya ada di `classifyRequestKind()` (`src/utils/metrics.util.ts`).

---

## 6. Kenapa `/metrics` di-exclude?

Tiga middleware melewati path `/metrics`:

| Middleware | Alasan |
|---|---|
| `metricsMiddleware` | agar `/metrics` tidak menghitung dirinya sendiri |
| `rateLimiterMiddleware` | agar scrape Prometheus tidak kena `429` |
| `requestLoggerMiddleware` | agar log tidak penuh dari scrape |

---

## 7. Known issue: queue metrics

Worker berjalan di **proses terpisah** (`bun run worker`) dan **tidak** punya
HTTP server. Jadi `queue_jobs_total` tercatat di memori worker, tapi tidak bisa
di-scrape dari `/metrics` proses API. Perbaikannya (belum dikerjakan): worker
membuka endpoint `/metrics` sendiri di port terpisah, atau push ke gateway.

---

## 8. Istilah TS/JS yang muncul

- **Registry** — objek di memori tempat prom-client menyimpan semua angka.
- **Library/package** — kode siap pakai dari npm; di sini `prom-client`.
- **Middleware** — fungsi `(c, next)` yang menyisip di alur request.
- **Counter / Histogram** — tipe metrik dari prom-client.
- **Label** — kategori yang menempel pada angka (`method`, `path`, `status`).
- **Environment variable** — pengaturan dari `.env`.

---

## 9. Ringkas

```
contextMiddleware  → T0
metricsMiddleware  → inc counter + observe histogram (pakai T0)
registry (memori)  → angka berkumpul
GET /metrics       → render jadi teks Prometheus
Prometheus         → scrape tiap ~15s → simpan time-series
```
