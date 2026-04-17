# 02 Architecture Structure

## High-Level Architecture: Hybrid Fullstack

Dokumentasi repo menetapkan arsitektur dua wilayah:

1. **Server Region (`src/`)**: 
   `Routes -> Controllers -> Services -> Repositories -> Database`
   Ditambah **Hono JSX** untuk Server-Side Rendering (SSR).

2. **Asset Region (`resources/`)**: 
   `Vue SFC -> Vue Router -> Vite -> Assets`
   Pusat interaksi client-side (SPA).

## Important Reality Check

Proyek ini menggunakan pola **"The Bridge"**:
- Hono merender shell HTML awal (SSR) dan menyuntikkan data server (`initialData`).
- Vue.js mengambil alih (hydration) untuk interaktivitas di sisi client.
- Vite mengelola bundling aset (JS/CSS/Vue) dan manifest di produksi.

## Entry Points

### App Composition & SSR
- [src/app.ts](src/app.ts): Bootstrap middleware, route aggregator, dan SPA fallback handler.
- [src/views/Welcome.tsx](src/views/Welcome.tsx): Master layout/shell yang memuat Vue dan menyuntikkan data server.

### Frontend Entry (Client)
- [resources/js/app.ts](resources/js/app.ts): Entry point utama Vue yang melakukan mounting ke `#app`.

### Worker Entry
- [src/workers/index.ts](src/workers/index.ts): Bootstrap untuk background processing.

## Root and Subdirectory Structure

### Backend Logic (`src/`)
- `src/views`: Komponen Hono JSX (Layouts & Pages).
- `src/routes`: Modular routing (`api.routes.ts`, `web.routes.tsx`).
- `src/middlewares`: Termasuk `spaFallback.middleware.ts` untuk navigasi SPA.
- `src/database`, `src/configs`, `src/queues`, `src/utils`.

### Frontend Assets (`resources/`)
- `resources/js`: Vue components, pages, dan router logic.
- `resources/css`: Tailwind CSS v4 entry.
- `resources/public`: Aset statis mentah (favicon, robots).

- `scripts/migrations`: migration framework untuk semua target database, sekarang dengan target connection eksplisit untuk SQLite, MySQL, MongoDB, dan PostgreSQL
- `scripts/seeders`: seeder runner
- `scripts/stubs`: template generator kode
- `scripts/make.ts`: CLI generator

### Storage

- `storages/database/sqlite`: file SQLite lokal
- `storages/logs`: log output per service dan per tanggal

### Docs

- `docs/getting-started`: setup dan deployment
- `docs/guides`: guide operasional seperti migration, seeder, queue, logging, make CLI, dan example CRUD
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
