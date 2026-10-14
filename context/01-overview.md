# 01 Overview

## Project Identity

- Project name: `hono-multi-db-api`
- Type: Fullstack Boilerplate (Hono JSX SSR)
- Runtime: Bun 1.4.3 (pinned in `.bun-version`)
- Framework: Hono (Backend and SSR)
- Language: TypeScript
- Repository purpose: menyediakan fondasi aplikasi fullstack dengan Hono JSX SSR, Tailwind CSS, multi-database, dan background worker.

## Primary Purpose

Repo ini menyediakan baseline teknis untuk:

- **Server-rendered UI**: Halaman dirender dengan Hono JSX.
- **CSS Tooling**: Vite 8 menyajikan Tailwind CSS v4 saat development dan mengompilasinya untuk production.
- **Multi-Database**: Koneksi beberapa database dengan named multi-connections.
- **Backend Power**: Migration, Seeder, Background Queue, dan Logging.

## Technology Stack

### Backend & SSR
- Bun & Hono
- Hono JSX (Server-side Rendering)
- Zod & `@hono/zod-validator`

### Styling and Assets
- Vite 8
- Tailwind CSS v4

### Database and storage
- SQLite, MySQL, PostgreSQL, MongoDB
- Redis (Cache & Queue Transport)

### Background processing
- BullMQ

### Observability
- `prom-client` (metrics, format Prometheus)
- Logger JSONL internal (tanpa dependency tambahan)

## Named Connection Model

Model yang sekarang tersedia di codebase:

- SQLite: `sqlite1`
- MySQL: `mysql1`
- MongoDB: `mongo1`
- Redis: `redis1`
- PostgreSQL: `pg1`

Ini berarti repo tidak lagi hanya “mendukung banyak engine database”, tetapi juga mendukung **beberapa koneksi bernama di dalam engine yang sama**.

## Business Context

Business context tidak terlihat dari codebase saat ini. Yang terlihat justru kebutuhan teknis untuk:

- membangun API modular
- mendukung beberapa engine database
- mendukung beberapa connection target di engine yang sama
- menjalankan proses async di luar request lifecycle

## Key Entities

Belum ada business entity nyata yang diposisikan sebagai domain utama skeleton. Source saat ini memang menyertakan modul netral `example`, tetapi itu harus dibaca sebagai reference implementation, bukan business context inti.

Entity teknis yang sudah jelas:

- request
- response
- application error
- named database connection
- queue
- worker
- migration
- seeder

## Current Product Surface

Permukaan aplikasi yang aktif saat ini terdiri dari:

- `GET /api/health` — liveness (uptime + timestamp)
- `GET /api/health/ready` — readiness (cek dependency aktif, mis. `sqlite1`/`redis1`)
- `GET /metrics` — metrik Prometheus (aktif bila `METRICS_ENABLED=true`)
- `GET /api/spec` — OpenAPI 3.0 JSON spec
- `GET /api/docs` — Scalar API Reference (interaktif)
- Modul referensi `example` di `/api/example/cruds`

`/api/health` berfungsi sebagai smoke check aplikasi. `/api/health/ready` dipakai
orchestrator untuk mengetahui apakah dependency siap menerima trafik. Modul
`example` berfungsi sebagai contoh runnable untuk pola implementasi, bukan
sebagai fitur bisnis utama skeleton.

## Observability

Status per pilar (detail di `plans/observability/`):

- **Logs** — JSONL terstruktur, `reqId` via `AsyncLocalStorage`, filter
  `LOG_LEVEL`, redaksi data sensitif, log job + propagasi `reqId` ke worker.
- **Health & readiness** — `/api/health/ready` dengan timeout.
- **Metrics** — `prom-client`, endpoint `/metrics` (HTTP RED + queue), label
  `kind` (`api`/`web`), proteksi opsional `x-metrics-token`.
- **Tracing** — ditunda (phase-4).

## Default Development Posture

Berdasarkan `.env.example`, mode pengembangan lokal yang paling realistis adalah:

- SQLite aktif
- Redis aktif
- MySQL nonaktif
- PostgreSQL nonaktif
- MongoDB nonaktif

Artinya jalur default skeleton kemungkinan besar adalah API Hono + SQLite + Redis, dengan default connection yang paling natural saat local dev:

- `sqlite1`
- `redis1`

Env observability yang relevan:

- `LOG_LEVEL` — default `info`
- `METRICS_ENABLED` — default `false`
- `METRICS_TOKEN` — opsional (shared-secret untuk `/metrics`)
