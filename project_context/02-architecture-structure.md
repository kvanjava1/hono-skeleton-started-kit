# 02 Architecture Structure

## High-Level Architecture

Dokumentasi repo menetapkan layered architecture:

`Routes -> Controllers -> Services -> Repositories -> Database`

Ini adalah intent arsitektur yang jelas dan cukup sehat untuk aplikasi backend modular.

## Important Reality Check

Implementasi default sekarang sudah memiliki satu modul referensi netral yang menembus layer utama tersebut, tetapi fondasi tetap menjadi fokus utama repo. Yang sudah ada secara nyata:

- app bootstrap
- middleware global
- connection layer dengan named multi-connections untuk seluruh engine utama
- util error/response/logger/cache/context
- queue factory
- worker bootstrap
- CLI generator
- modul referensi `example` yang mencakup route, controller, service, repository, schema, job, migration, cache, dan test

Yang belum ada sebagai bawaan:

- domain bisnis nyata
- relasi antar modul bisnis
- bounded context production yang benar-benar merepresentasikan aplikasi turunan

Jadi arsitektur repo ini bisa dibaca sebagai:

- arsitektur target: layered modular API
- status aktual: foundational skeleton dengan satu executable reference module

## Entry Points

### API entry point

- [src/index.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/index.ts)

Tanggung jawab:

- mendeteksi mode API vs worker
- connect semua database yang aktif
- start server Hono
- shutdown handling

### App composition

- [src/app.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/app.ts)

Tanggung jawab:

- membuat instance Hono
- memasang middleware global
- register seluruh route
- menetapkan global 404 handler

### Worker entry point

- [src/workers/index.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/workers/index.ts)

Tanggung jawab:

- bootstrap worker mode
- menjadi tempat registrasi worker BullMQ

## Root and Subdirectory Structure

### Source

- `src/configs`: konfigurasi runtime, database, queue, env helper, dan named connection discovery
- `src/database`: connection factory / registry untuk MySQL, PostgreSQL, MongoDB, Redis, SQLite
- `src/middlewares`: cross-cutting HTTP concerns
- `src/routes`: route wiring
- `src/queues`: queue dan worker factory
- `src/workers`: startup worker
- `src/utils`: helper response, error, cache, context, logging

### Tooling

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
