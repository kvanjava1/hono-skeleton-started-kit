# 02 Architecture Structure

## High-Level Architecture: Hono JSX SSR

Dokumentasi repo menetapkan arsitektur dua wilayah:

1. **Application Region (`src/`)**:
   `Routes -> Controllers -> Services -> Repositories -> Database`
   Controller merender view **Hono JSX** untuk Server-Side Rendering (SSR).

2. **UI and CSS (`resources/`)**:
   `Hono JSX views + Tailwind CSS -> Vite -> CSS asset`

## Rendering and CSS Flow

- Hono merender halaman HTML di server dari komponen JSX.
- Tailwind memindai class pada view JSX melalui directive `@source` di `resources/css/app.css`.
- Saat development, Vite melayani CSS dan client HMR di port 5173.
- Saat production, `bun run build:css` menulis CSS dan manifest ke `dist/`; Hono membaca manifest untuk menautkan stylesheet dan melayani aset `/assets/*`.

## Entry Points

### App Composition & SSR
- [src/app.ts](src/app.ts): Bootstrap middleware and route aggregator.
- [resources/views/example/Index.tsx](resources/views/example/Index.tsx): Hono JSX SSR landing page.
- [resources/css/app.css](resources/css/app.css): Tailwind CSS entry dan source scanning configuration.
- [vite.config.ts](vite.config.ts): Vite CSS dev server and production build configuration.

### Worker Entry
- [src/workers/index.ts](src/workers/index.ts): Bootstrap untuk background processing.

## Root and Subdirectory Structure

### Backend Logic (`src/`)
- `src/routes`: Modular routing structure:
    - `src/routes/api/`: Semua endpoint REST API (prefix `/api`).
      - `health/health.router.ts`, `docs/docs.router.ts`,
        `metrics/metrics.router.ts`, `example/crud.router.ts`
      - `src/routes/api/index.ts`: hanya mounting sub-router.
    - `src/routes/web/`: Semua rute halaman SSR (Hono JSX).
    - `src/routes/index.ts`: Aggregator utama rute (termasuk Global 404).
- `src/controllers`, `src/services`, `src/repositories`, `src/validations`, `src/database/schema`, `src/jobs`: 
    - Menggunakan struktur folder modular berbasis domain (misal: `src/controllers/example/`, `src/controllers/health/`).
    - `src/validations/` untuk Zod request/response schemas.
    - `src/database/schema/` untuk Drizzle table definitions.
    - File dalam folder domain menggunakan penamaan **camelCase** (misal: `crud.controller.ts`).
- `src/middlewares`: Modular middlewares terbagi menjadi `common/`, `api/`, dan `web/` dengan dispatching berbasis path.
    - `common/` mencakup `metrics.middleware.ts` (pengukur request untuk `/metrics`).
- `src/database`, `src/configs`, `src/queues`, `src/utils`.
    - `src/utils` mencakup `logger.util.ts`, `metrics.util.ts`, `async.util.ts`,
      `context.util.ts`, `cache.util.ts`.

### UI and CSS (`resources/`)
- `resources/views/`: Halaman Hono JSX yang dirender di server.
- `resources/css/app.css`: Entry Tailwind CSS v4 dan lokasi `@source` untuk scanning view.

### Static Assets
- `public/`: Folder di **root proyek** untuk aset statis mentah (favicon, robots.txt, dll).

- `scripts/migrations`: migration framework untuk semua target database, sekarang dengan target connection eksplisit untuk SQLite, MySQL, MongoDB, dan PostgreSQL
- `scripts/seeders`: seeder runner
- `scripts/stubs`: template generator kode
- `scripts/make.ts`: CLI generator

### Storage

- `storages/database/sqlite`: file SQLite lokal
- `storages/logs`: log output per service dan per tanggal

### Docs

- `docs/getting-started`: setup dan deployment
- `docs/guides`: guide operasional seperti migration, seeder, queue, logging, dan make CLI
- `docs/standards`: aturan arsitektur, conventions, error handling, dan API patterns
- `docs/reference`: penjelasan teknis yang lebih stabil seperti architecture overview dan connection model

## Data Flow

#### Data Flow:
- Trigger: HTTP request masuk ke Hono route
- Step 1: middleware global berjalan lebih dulu
- Step 2: route handler atau controller menerima request
- Step 3: service layer menjalankan business logic bila modul domain sudah ada
- Step 4: repository membaca/menulis database target
- Step 5: response util mengembalikan respons standar

Untuk worker:

#### Data Flow:
- Trigger: worker process dijalankan atau job dimasukkan ke queue
- Step 1: worker BullMQ menerima payload job
- Step 2: processor menjalankan orchestration async
- Step 3: service atau repository melakukan operasi yang diperlukan
- Step 4: hasil job dicatat ke logger

## Design Patterns Used

Pola yang benar-benar terlihat di codebase:

- layered architecture
- centralized error handling
- factory/registry pattern untuk connection dan queue
- Drizzle ORM sebagai query builder untuk SQL databases (SQLite/MySQL/PG)
- Proxy/function `createLazyConfig()` untuk lazy initialization + `reset*Config()` untuk testability
- request context propagation via `AsyncLocalStorage`
- environment-driven feature toggles
- named connection targeting per database engine

## Configuration Strategy

Konfigurasi dipusatkan di `src/configs/*`.

Pola yang dipakai:

- helper env bertipe sederhana
- config object atau config function per concern
- database enablement via toggle boolean
- named connection registry untuk engine yang mendukung multi-connection

Ini membuat startup cukup fleksibel, tetapi juga berarti perilaku runtime sangat dipengaruhi oleh env file yang aktif.
