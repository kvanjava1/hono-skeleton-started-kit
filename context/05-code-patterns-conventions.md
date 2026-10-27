# 05 Code Patterns Conventions

## Existing Architectural Rule

Aturan utama dari docs:

`Routes -> Controllers -> Services -> Repositories -> Database`

Prinsipnya sehat dan perlu dipertahankan saat modul domain pertama dibuat.

## File Naming Conventions

Berdasarkan dokumentasi (dengan penyesuaian ke pola aktual):

- routes: `camelCase.router.ts` — pola aktual yang dominan
  (`crud.router.ts`, `health.router.ts`, `metrics.router.ts`)
- controllers: `camelCase.controller.ts` (Strictly camelCase for new modules)
- services: `camelCase.service.ts` (Strictly camelCase for new modules)
- repositories: `camelCase.repository.ts`
- validations (Zod): `camelCase.schema.ts` in `src/validations/`
- database tables (Drizzle): `camelCase.schema.ts` in `src/database/schema/`
- middlewares: `camelCase.middleware.ts` atau `snake_case.ts`
  - Simpan di folder yang sesuai: `api/`, `web/`, atau `common/`.
- utils: `snake_case.util.ts`
- jobs: `camelCase.job.ts` (Transitioned from PascalCase to maintain uniformity with controllers/services)
- database connection: `snake_case.connection.ts`

### Modular Folder Pattern
Untuk setiap modul domain atau halaman web baru:
- `src/controllers/example/`
- `src/services/example/`
- `src/repositories/example/`
- `src/validations/example/`
- `src/database/schema/example/`
- `src/routes/api/example/`
- `resources/views/example/`

Modul infrastruktur mengikuti pola folder yang sama. Contoh aktual:

- `src/controllers/health/health.controller.ts`
- `src/routes/api/health/health.router.ts`
- `src/routes/api/docs/docs.router.ts`
- `src/routes/api/metrics/metrics.router.ts`

## Import Conventions

Convention yang eksplisit:

- gunakan ekstensi `.ts` di import
- style import banyak memakai namespace import seperti:
  - `import * as ProductService from '../services/product.service.ts'`

## Connection Conventions

Setelah refactor fondasi database, aturan yang paling penting sekarang adalah:

- pilih target connection secara eksplisit untuk operasi domain baru
- jangan mengandalkan default compatibility path kecuali memang dibutuhkan untuk backward compatibility

Named connections yang sekarang tersedia:

- SQLite: `sqlite1`
- MySQL: `mysql1`
- MongoDB: `mongo1`
- Redis: `redis1`
- PostgreSQL: `pg1`

Praktik yang disarankan:

- repository SQLite (Drizzle): `getDrizzleDb('sqlite1')`
- repository MySQL (Drizzle): `getDrizzleDb('mysql1')`
- repository PostgreSQL (Drizzle): `getDrizzleDb('pg1')`
- repository MongoDB (native): `getMongoDb('mongo1')`
- queue/cache Redis: pilih `redis1` atau target lain secara sadar

## Response Conventions

Response harus memakai helper:

- `successResponse()`
- `errorResponse()`

Controller tidak seharusnya membangun payload response sendiri.

## Error Handling Conventions

Pattern yang harus diikuti:

- business/service layer melempar `AppError` subclass
- controller tidak menangani expected app error dengan `try/catch`
- global handler yang menormalisasi response
- external library error ditransformasikan jika perlu

## Logging Conventions

Pattern yang didorong docs:

- gunakan prefix modul pada pesan log
- contoh: `[ProductService] Product created`

Pattern aktual di source:

- beberapa file masih memakai pesan log umum tanpa prefix modul

Jadi, untuk kode baru lebih baik konsisten memakai prefix modul.

## Reuse and Shared Utilities

Utility yang sudah ada dan perlu dicek sebelum membuat helper baru:

- [src/utils/response.util.ts](src/utils/response.util.ts)
- [src/utils/errors.util.ts](src/utils/errors.util.ts)
- [src/utils/logger.util.ts](src/utils/logger.util.ts)
- [src/utils/cache.util.ts](src/utils/cache.util.ts)
- [src/utils/context.util.ts](src/utils/context.util.ts)

Sebelum menambah helper baru, area ini wajib dicek dulu.

## Real Convention Gaps

Ada beberapa gap antara docs, generator, dan implementasi nyata:

### Service and repository placement

Struktur saat ini menggunakan folder domain-based (bukan per-engine):

- `src/services/example/`
- `src/repositories/example/`
- `src/validations/example/`
- `src/database/schema/example/`

Service bersifat DB-agnostic — tidak perlu tahu engine database mana yang dipakai. Koneksi ditangani sepenuhnya di repository layer.

### Connection defaults vs explicit targeting

Codebase sekarang masih menyediakan compatibility default untuk:

- `getMysqlPool()` -> `mysql1`
- `getMongoDb()` -> `mongo1`
- `getRedis()` -> `redis1`
- `getPgSql()` -> `pg1`

Namun untuk kode baru, explicit targeting tetap lebih aman.

### Cache integration

Cache adalah tanggung jawab **service layer**, bukan controller. Service memanggil `cacheGet`/`cacheSet`/`cacheDelete` dari `src/utils/cache.util.ts`.

- `cacheGet`: return `null` jika Redis tidak aktif
- `cacheSet`/`cacheDelete`: silent skip jika Redis tidak aktif
- Cache di-invalidate pada operasi mutasi (create, update, delete)

### OpenAPI + Scalar

Semua route API menggunakan `@hono/zod-openapi` (`OpenAPIHono`, `createRoute`). Path parameter menggunakan `{id}` (OpenAPI 3.0 standard) — Hono mengonversi internal ke `:id`.

Setiap route sebaiknya mengisi `tags`, `summary`, dan `description` agar tampil
rapi di Scalar.

Validasi request berjalan otomatis: `.openapi()` memasang `zValidator` dari
schema di `createRoute` (body, param, query, header, cookie). Error validasi
dinormalisasi ke kontrak response aplikasi lewat `openApiValidationHook`
(`src/utils/openapi.util.ts`) yang dipasang sebagai `defaultHook` pada
`OpenAPIHono`. Controller membaca hasil validasi dengan `c.req.valid("json")` /
`c.req.valid("param")`, dan tipe input diambil dari `z.infer` di file validations
(mis. `IdParam` memakai `z.coerce.number().int().positive()`).

Spec JSON tersedia di `GET /api/spec`, Scalar UI di `GET /api/docs`.

Catatan: `/api/spec` dan `/api/docs` didaftarkan lewat `registerDocsRoutes(app)`
di `src/routes/api/docs/docs.router.ts`, karena `OpenAPIHono.doc()` harus dipanggil
di instance root agar spec memuat semua route.

### Routes

Route modular adalah pola utama. Contoh aktual:

- `src/routes/api/health/health.router.ts`
- `src/routes/api/docs/docs.router.ts`
- `src/routes/api/metrics/metrics.router.ts`
- `src/routes/api/example/` (crud)

`src/routes/api/index.ts` hanya melakukan mounting sub-router.

### Metrics

- Registry & definisi metrik: `src/utils/metrics.util.ts` (prom-client).
- Middleware pengukur: `src/middlewares/common/metrics.middleware.ts`.
- Label `path` wajib memakai pola route (`normalizeRoutePath`), ditambah label
  `kind` (`api`/`web`).
- `/metrics` di-exclude dari rate limiter dan request logger.
- Metrik queue dicatat di `src/queues/base.queue.ts` (lihat catatan known issue
  di `plans/observability/`).

### Code style

Source saat ini memakai campuran single quote dan double quote. Jadi style formatting belum sepenuhnya seragam.

## Recommended Rule for Future Work

Sebelum implementasi baru:

1. cek apakah ada util atau pattern existing
2. cek apakah naming dan folder target sudah konsisten dengan area terkait
3. jika docs dan implementation conflict, prioritaskan pattern aktual yang paling dominan atau putuskan standardisasi dulu
4. jangan tambah dependency baru sebelum kebutuhan benar-benar jelas

## Safe Working Assumption

Asumsi paling aman untuk task berikutnya:

- pertahankan layered architecture
- gunakan response util yang sudah ada
- gunakan app error yang sudah ada
- pilih target database secara eksplisit
- anggap migration untuk SQLite, MySQL, MongoDB, dan PostgreSQL harus target-aware
- baca modul `example` sebagai baseline teknis, bukan domain bisnis yang harus diwariskan
- jangan invent pattern baru tanpa alasan kuat

## Fullstack Conventions

### Hono JSX (SSR)
- Gunakan ekstensi `.tsx` untuk komponen yang mengandung JSX.
- Tambahkan pragma `/** @jsxImportSource hono/jsx */` di bagian atas file jika IDE mengalami masalah tipe.
- Komponen harus ditempatkan di `resources/views/`.
- Controller web memanggil komponen view dan mengembalikan hasilnya dengan `c.html()`.

### Styling (Tailwind v4)
- Gunakan direktif `@import "tailwindcss";` di `resources/css/app.css`.
- Pastikan file view JSX tercakup oleh `@source` agar class utility ikut dibuat.
- Gunakan `bun run dev:css` untuk Vite saat development dan `bun run build:css` untuk output production di `public/build/`.
- Hindari penggunaan file `tailwind.config.js` karena v4 menggunakan konfigurasi berbasis CSS.

## Post-Implementation Checklist

Setelah implementasi:
1. Wajib jalankan `bun run typecheck` untuk memverifikasi tidak ada error sintaks TypeScript di keseluruhan project sebelum menganggap pekerjaan dan bugfix selesai.
