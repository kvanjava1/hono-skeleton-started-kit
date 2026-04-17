# 01 Overview

## Project Identity

- Project name: `hono-multi-db-fullstack`
- Type: Hybrid Fullstack Boilerplate (SSR + SPA)
- Runtime: Bun
- Framework: Hono (Backend/SSR) & Vue.js (Frontend SPA)
- Language: TypeScript
- Repository purpose: menyediakan fondasi aplikasi fullstack modern yang menggabungkan kecepatan Hono JSX (SSR) dengan fleksibilitas Vue.js 3 (SPA), didukung oleh multi-database dan background worker.

## Primary Purpose

Repo ini menyediakan baseline teknis untuk:

- **Hybrid Rendering**: Hono JSX untuk SSR/SEO-critical pages dan Vue.js untuk Dashboard/Interactive SPA.
- **Frontend Tooling**: Integrasi Vite 8 dengan Tailwind CSS v4 (zero-config).
- **Multi-Database**: Koneksi beberapa database dengan named multi-connections.
- **Backend Power**: Migration, Seeder, Background Queue, dan Logging.

## Technology Stack

### Backend & SSR
- Bun & Hono
- Hono JSX (Server-side Rendering)
- Zod & `@hono/zod-validator`

### Frontend (Assets)
- Vue.js 3 (Composition API)
- Vue Router 5
- Vite 8
- Tailwind CSS v4

### Database and storage
- SQLite, MySQL, PostgreSQL, MongoDB
- Redis (Cache & Queue Transport)

### Background processing
- BullMQ

## Named Connection Model

Model yang sekarang tersedia di codebase:

- SQLite: `sqlite1`
- MySQL: `mysql1`, `mysql2`
- MongoDB: `mongo1`, `mongo2`
- Redis: `redis1`, `redis2`
- PostgreSQL: `pg1`, `pg2`

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

- `GET /api/health`
- modul referensi `example` di `/api/examples`

`/api/health` berfungsi sebagai smoke check aplikasi. Modul `example` berfungsi sebagai contoh runnable untuk pola implementasi, bukan sebagai fitur bisnis utama skeleton.

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
