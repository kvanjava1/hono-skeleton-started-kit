# Simulasi Hasil Akhir Observability

> **Versi:** 1.1.0
> **Terakhir diperbarui:** 2026-09-14
> **Status:** Ilustrasi (phase-1–3 sudah diimplementasikan; trace masih ilustrasi)

Dokumen ini adalah **simulasi** gambaran akhir setelah observability dipasang.
Tujuannya: Anda bisa membayangkan bentuk nyata dari Logs, Metrics, dan Traces
serta cara memakainya, sebelum menulis kode.

> **Catatan penting**
> - **Logs** (phase-1) dan **Metrics** (phase-3) **sudah diimplementasikan**.
> - **Traces** (phase-4) **masih ditunda**; bagian trace di sini hanya ilustrasi
>   bentuknya nanti.
> - Nilai waktu, ID, dan isi data hanya contoh.

---

## Skenario

Kita mengikuti perjalanan **satu user** yang melakukan dua hal:

1. Membuat data lewat `POST /api/example/cruds` (langsung, sinkron).
2. Membuat data lewat `POST /api/example/cruds/job` (diproses worker di
   belakang).
3. Lalu satu request yang gagal (`GET /api/example/cruds/999` → tidak ada).

```text
┌────────┐
│ Client │
└───┬────┘
    │ 1) POST /api/example/cruds
    ▼
┌─────────────────────────────────────────────┐
│ Hono (proses: app)                           │
│  Middleware → Controller → Service → Repo    │
│       │            │          │        │      │
│     LOGS         LOGS       LOGS    SQLite   │
│       └────────── METRICS ────────────┘      │
└──────────────────┬──────────────────────────┘
                   │ 2) enqueue job ke Redis
                   ▼
            ┌─────────────┐
            │   Redis     │  (BullMQ)
            └──────┬──────┘
                   │ 3) worker ambil job
                   ▼
            ┌─────────────────┐
            │ Worker (queue)  │ → LOGS + METRICS
            └─────────────────┘
```

**Satu ID menghubungkan semuanya:** `reqId`
(contoh: `9f8c1e2a-7b3d-4c5e-8a1b-2d3e4f5a6b7c`).

---

## BAGIAN 1 — Request sukses (sinkron)

**Request:**

```http
POST /api/example/cruds HTTP/1.1
Content-Type: application/json
X-Request-Id: 9f8c1e2a-7b3d-4c5e-8a1b-2d3e4f5a6b7c

{ "title": "Hello", "content": "World" }
```

**Alur internal:**

1. `requestId()` membaca `X-Request-Id` dari klien (dipakai ulang).
2. `context.middleware` menyimpan `reqId` ke `AsyncLocalStorage`.
3. `rateLimiter.middleware` menaikkan hitungan di Redis.
4. `metrics.middleware` (phase-3) menyalakan stopwatch.
5. Controller `create` → Service `addCrud` → Repository `createCrud` → SQLite.
6. `metrics.middleware` mencatat durasi & status.

### 1a. Logs (yang muncul)

```json
{"time":"2026-09-11T08:30:00.100Z","level":"INFO","service":"app","reqId":"9f8c1e2a-7b3d-4c5e-8a1b-2d3e4f5a6b7c","module":"Http","msg":"Request completed","data":{"method":"POST","path":"/api/example/cruds","status":201,"durationMs":14,"ip":"203.0.113.10"}}
```

Cara membacanya:
- `reqId` → penghubung ke metrics & trace.
- `module: "Http"` → dari prefix `[Http]` pada pesan log.
- `status: 201`, `durationMs: 14` → field terpisah (bukan lagi di dalam teks).

### 1b. Metrics (yang bertambah)

```text
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",path="/api/example/cruds",status="201"} 1

# HELP http_request_duration_ms HTTP request duration in milliseconds
# TYPE http_request_duration_ms histogram
http_request_duration_ms_bucket{method="POST",path="/api/example/cruds",le="5"} 0
http_request_duration_ms_bucket{method="POST",path="/api/example/cruds",le="10"} 0
http_request_duration_ms_bucket{method="POST",path="/api/example/cruds",le="25"} 1
http_request_duration_ms_bucket{method="POST",path="/api/example/cruds",le="+Inf"} 1
http_request_duration_ms_sum{method="POST",path="/api/example/cruds"} 14
http_request_duration_ms_count{method="POST",path="/api/example/cruds"} 1
```

Cara membacanya:
- `http_requests_total ... 1` → sudah 1 request dengan status 201.
- `le="10"` = 0, `le="25"` = 1 → durasinya antara 10–25ms (memang 14ms).
- `path` memakai **pola route** (`/api/example/cruds`), bukan path ber-ID.

### 1c. Trace (ilustrasi phase-4)

```text
trace_id=4bf92f3577b34da6a3ce929d0e0e4736
└─ http.request POST /api/example/cruds [14ms]
   ├─ middleware.requestId [0ms]
   ├─ middleware.rateLimiter [3ms]
   │  └─ redis.incr [2ms]
   ├─ controller.create [10ms]
   │  └─ service.addCrud [9ms]
   │     ├─ db.sqlite.insert [7ms]
   │     └─ redis.del [1ms]
   └─ response [1ms]
```

Cara membacanya: total 14ms; paling banyak habis di `db.sqlite.insert` (7ms).

---

## BAGIAN 2 — Request async + worker

**Request:**

```http
POST /api/example/cruds/job HTTP/1.1
Content-Type: application/json
X-Request-Id: 3a7b9c1d-2e4f-4a6b-8c0d-1e2f3a4b5c6d

{ "title": "Async", "content": "Diproses worker" }
```

**Alur:**

1. Controller `createViaJob` memanggil `enqueueCrudCreate` → job masuk Redis.
2. Respons `202 Accepted` dikirim **tanpa menunggu** job selesai.
3. Worker (proses terpisah, `bun run worker`) mengambil job dan memprosesnya.

### 2a. Logs proses `app` (enqueue)

```json
{"time":"2026-09-11T08:31:00.050Z","level":"INFO","service":"app","reqId":"3a7b9c1d-2e4f-4a6b-8c0d-1e2f3a4b5c6d","module":"Http","msg":"Request completed","data":{"method":"POST","path":"/api/example/cruds/job","status":202,"durationMs":6,"ip":"203.0.113.10"}}
```

### 2b. Logs proses `queue` (worker memproses)

```json
{"time":"2026-09-11T08:31:00.310Z","level":"INFO","service":"queue","module":"Queue","msg":"Job completed","data":{"queue":"crud-create","jobId":"17"}}
{"time":"2026-09-11T08:31:00.315Z","level":"INFO","service":"queue","module":"CrudCreateJob","msg":"Crud [42] created via job"}
```

Cara membacanya:
- `service` berubah jadi `queue` → ini proses worker, bukan web.
- `jobId: "17"` → bisa dilacak di BullMQ.
- **Catatan:** `reqId` tidak otomatis ikut ke worker karena worker adalah proses
  terpisah. Untuk mengaitkannya, `reqId` perlu ikut dikirim di payload job
  (bisa ditambahkan di phase-1).

### 2c. Metrics (worker)

Metrics worker bisa menambah metrik seperti:

```text
# counter — jumlah job, tidak punya bucket
queue_jobs_total{queue="crud-create",status="completed"} 1

# histogram — durasi job, punya bucket dengan `le`
queue_job_duration_ms_bucket{queue="crud-create",le="50"} 0
queue_job_duration_ms_bucket{queue="crud-create",le="100"} 0
queue_job_duration_ms_bucket{queue="crud-create",le="250"} 1
queue_job_duration_ms_bucket{queue="crud-create",le="500"} 1
queue_job_duration_ms_bucket{queue="crud-create",le="+Inf"} 1
queue_job_duration_ms_sum{queue="crud-create"} 250
queue_job_duration_ms_count{queue="crud-create"} 1
```

Cara membacanya: job selesai dalam 250ms → masuk bucket `le="250"` (dan semua
bucket di atasnya, karena kumulatif). Skala bucket job sengaja lebih besar dari
HTTP karena job biasanya berjalan lebih lama. **Counter** (seperti
`queue_jobs_total`) tidak punya `le`; hanya **histogram** yang punya.

---

## BAGIAN 3 — Request gagal

**Request:**

```http
GET /api/example/cruds/999 HTTP/1.1
X-Request-Id: 5c6d7e8f-9a0b-4c1d-8e2f-3a4b5c6d7e8f
```

Data dengan id 999 tidak ada → Service melempar `NotFoundError` → ditangani
`errorHandler`.

### 3a. Logs (level WARN, bukan ERROR)

```json
{"time":"2026-09-11T08:32:00.200Z","level":"WARN","service":"app","reqId":"5c6d7e8f-9a0b-4c1d-8e2f-3a4b5c6d7e8f","module":"Http","msg":"[GET] /api/example/cruds/999 - Crud not found","data":{"name":"NotFoundError","requestId":"5c6d7e8f-...","method":"GET","path":"/api/example/cruds/999","query":{},"ip":"203.0.113.10","userAgent":"curl/8.0","contentType":"unknown"}}
```

Cara membacanya:
- `level: "WARN"` → error yang **diharapkan** (kesalahan user), bukan bug.
- Error tak terduga (bug) akan muncul sebagai `level: "ERROR"` **beserta stack
  trace**, dan di production pesannya di-mask.

### 3b. Metrics (counter error bertambah)

```text
http_requests_total{method="GET",path="/api/example/cruds/{id}",status="404"} 1
```

### 3c. Trace (ilustrasi)

```text
└─ http.request GET /api/example/cruds/{id} [5ms]
   ├─ controller.getById [4ms]
   │  └─ service.findCrud [3ms]
   │     └─ db.sqlite.select [2ms]
   └─ error NotFoundError [0ms]
```

---

## BAGIAN 4 — Health check

### 4a. Liveness — `GET /api/health`

```json
{
  "status": "success",
  "message": "OK",
  "data": { "uptime": 123.45, "timestamp": "2026-09-11T08:33:00.000Z" }
}
```

Artinya: "proses masih hidup". Tidak memeriksa dependency.

### 4b. Readiness — `GET /api/health/ready` (phase-2)

**Saat semua siap (200):**

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

**Saat Redis mati (503):**

```json
{
  "status": "error",
  "message": "Not ready",
  "data": {
    "checks": [
      { "name": "sqlite1", "status": "up", "latencyMs": 1 },
      { "name": "redis1", "status": "down", "latencyMs": 2000, "error": "timeout" }
    ]
  }
}
```

Artinya: load balancer/orchestrator bisa **berhenti mengirim trafik** ke
instance yang belum siap, tanpa mematikan prosesnya.

---

## BAGIAN 5 — Alur investigasi nyata

Inilah gunanya ketiga pilar saling terhubung. Misal ada laporan "aplikasi
lambat":

```text
1. ALERT (dari METRICS)
   http_request_duration_ms P95 naik dari 20ms → 400ms
        │
        ▼
2. CARI TRACE yang lambat (durasi besar)
   ternyata span `db.sqlite.insert` = 350ms
        │
        ▼
3. BUKA LOGS dengan reqId trace tersebut
   {"reqId":"...","msg":"Request completed","data":{"durationMs":380,...}}
   {"reqId":"...","level":"WARN","msg":"...slow query..."}
        │
        ▼
4. KESIMPULAN
   Query database tertentu lambat → tambah index / perbaiki query
```

Tanpa observability, langkah ini hanya bisa ditebak. Dengan observability, tiap
langkah punya bukti.

---

## Ringkasan

| Pilar | Pertanyaan | Muncul di mana | Status |
|---|---|---|---|
| **Logs** | Apa yang terjadi? | File `storages/logs/`, console | Ada (diperbaiki di phase-1) |
| **Metrics** | Seberapa banyak/cepat? | Endpoint `/metrics` | phase-3 |
| **Traces** | Langkah mana yang lambat? | Collector trace (mis. Jaeger) | phase-4 (ditunda) |

**Penghubung ketiganya:** `reqId` yang sama sejak request masuk sampai selesai
(dan diteruskan ke job agar worker bisa dilacak juga).
