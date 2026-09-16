# 08 Risks Insights

## Technical Debt Signals

### Docs vs implementation mismatch

Dokumentasi menjelaskan skeleton seolah semua layer domain sudah hadir, tetapi implementasi default masih fokus pada fondasi. Ini bisa menyesatkan jika orang baru membaca docs tanpa membaca source.

### Limited test baseline

Repo sekarang memiliki **13 test files / 84 tests** (`bun test`) yang mencakup:

- config parsing, error handling, response contract
- logging (redaksi, `LOG_LEVEL`, format request/job)
- metrics (normalisasi path, `kind`, `/metrics`, token)
- health/readiness, CRUD SQLite, OpenAPI spec, rate limiter

Yang masih terbatas:

- E2E lintas proses (worker + Redis) belum otomatis — masih manual
- integrasi MySQL/PostgreSQL/MongoDB tidak diuji otomatis
- tracing belum ada (phase-4 ditunda)

Dampaknya: refactor fondasi tetap butuh kehati-hatian, dan bug lintas
database/worker masih bisa lolos.

### Convention ambiguity

Sebagian sudah diselesaikan:

- naming route disepakati `.router.ts` (mengikuti pola aktual)
- struktur folder modular konsisten (`src/routes/api/<fitur>/`,
  `src/controllers/<fitur>/`)
- style formatting masih campur single/double quote

## Fragile Areas

### Startup dependency coupling

`src/index.ts` menghubungkan startup aplikasi langsung dengan keberhasilan koneksi database yang aktif. Jika satu dependency aktif gagal, startup gagal total.

Ini aman untuk strict startup validation, tetapi mengurangi fleksibilitas partial mode.

### Rate limiter Redis dependency

Rate limiter mengandalkan Redis per-request untuk akurasi global. Risiko:

- Redis failure → fallback ke in-memory (tidak konsisten antar instance)
- Redis latency ~3ms per request — acceptable di 1000 req/s, bisa jadi bottleneck di 10k+ req/s
- tanpa Redis, rate limiter hanya valid per process (memory Map)

### Logger filesystem dependency

Logger menulis ke filesystem lokal. Ini baik untuk local/dev sederhana, tetapi bisa bermasalah pada:

- immutable container
- ephemeral filesystem
- platform dengan volume write terbatas

### Metrics queue tidak ter-expose

Metrik queue (`queue_jobs_total`, `queue_job_duration_ms`) dicatat di proses
worker yang tidak menjalankan HTTP server. Akibatnya `/metrics` di proses API
selalu kosong untuk metrik queue. Perlu endpoint `/metrics` di worker (port
terpisah) atau push gateway.

### Rate limiter noise saat Redis down

Jika `DB_REDIS_ENABLED=true` tapi Redis tidak reachable, rate limiter fail-open
(request tetap jalan) tetapi mencatat `logger.error` pada setiap request — log
bisa penuh saat outage. Perlu peringatan sekali saja atau circuit breaker.

## Hidden Coupling

### Env-driven behavior

Banyak perilaku runtime tersembunyi di env toggle. Ini membuat codebase fleksibel, tetapi coupling ke konfigurasi menjadi tinggi.

### Named connection expansion

Setelah seluruh engine utama mendukung named connections, ada coupling baru yang sehat tetapi penting:

- `sqlite1`
- `mysql1`
- `mongo1`
- `redis1`
- `pg1`

Ini membuat explicit targeting lebih aman, tetapi juga menaikkan kebutuhan konsistensi docs, stub, dan migration runner.

### Reference module can be mistaken as real domain

Karena repo sekarang menyertakan modul `example`, ada risiko orang baru menganggapnya sebagai domain bawaan yang harus dipertahankan.

Yang benar:

- `example` adalah reference module
- project turunan boleh menghapus atau menggantinya
- domain bisnis nyata tidak seharusnya diwariskan dari nama `example`

### First real business module will still define the standard

Walaupun reference module sudah ada, modul bisnis nyata pertama tetap akan menjadi template de facto untuk:

- struktur folder
- naming
- level abstractions
- penggunaan queue/cache
- testing approach

Ini coupling sosial-teknis yang penting untuk disadari.

## Risky Assumptions to Avoid

- menganggap docs selalu sama dengan source aktual
- menganggap service/repository structure sudah final
- menganggap multi-database berarti satu feature harus mendukung semua database sekaligus
- menganggap default connection compatibility path adalah pola terbaik untuk kode baru
- menganggap worker system sudah lengkap hanya karena queue infra sudah ada
- menganggap metrik queue sudah bisa di-scrape dari proses API (padahal worker
  proses terpisah)
- menganggap tracing wajib ada; untuk monolith, log + metrics biasanya cukup

## Migration and Refactor Hazards

- perubahan pada util dasar bisa mempengaruhi seluruh skeleton
- perubahan pada startup atau middleware bisa mempengaruhi semua endpoint
- perubahan pada logger atau error handler berpotensi mengubah observability dan response behavior secara global
- perubahan pada generator stub bisa mempengaruhi bentuk module berikutnya
- perubahan pada connection registry atau config naming bisa mempengaruhi semua database engine sekaligus

## Recommended Guardrails

Saat mengerjakan task berikutnya, guardrail yang paling masuk akal adalah:

1. mulai dari impact analysis ke area yang benar-benar disentuh
2. cek reuse sebelum membuat helper baru
3. pilih satu target database per feature bila memungkinkan
4. jangan refactor fondasi sambil menambah feature kecuali memang disetujui
5. bila ada ambiguity convention, putuskan lebih dulu sebelum menyebarkan pattern baru

## Final Insight

Repo ini punya fondasi teknis yang cukup baik, dan sekarang juga sudah punya contoh end-to-end netral lewat modul `example`. Karena itu, risiko terbesar bukan lagi “tidak ada contoh”, tetapi salah membaca reference module sebagai domain bisnis permanen atau menerapkan polanya secara inkonsisten.

Sekarang repo juga sudah punya fondasi multi-connection yang cukup kuat untuk semua engine utama. Karena itu, risiko barunya bergeser dari “belum ada capability” menjadi “capability sudah ada, tetapi bisa dipakai secara inkonsisten bila tim tidak disiplin pada explicit targeting dan convention.”

Observability phase-1–3 (logging, health/readiness, metrics) sudah selesai;
tracing ditunda. Risiko berikutnya bukan lagi “tidak bisa dipantau”, melainkan
memastikan metrik/label dipakai konsisten dan metrik queue benar-benar
ter-expose saat dibutuhkan.
