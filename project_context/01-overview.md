# 01 Overview

## Project Identity

- Project name: `hono-multi-db-api`
- Type: backend skeleton / starter kit
- Runtime: Bun
- Framework: Hono
- Language: TypeScript
- Repository purpose: menyediakan fondasi API yang siap dikembangkan dengan pilihan beberapa database, named multi-connections, worker background, dan tooling operasional.

## Primary Purpose

Repo ini tidak memodelkan bisnis tertentu. Tujuan utamanya adalah memberi baseline teknis untuk:

- HTTP API
- koneksi beberapa database dengan named multi-connections
- migration dan seeder
- background queue
- logging
- file generation untuk layer kode baru

Dengan kata lain, ini adalah repo infra-first, bukan aplikasi bisnis yang sudah lengkap.

## Technology Stack

### Backend

- Bun
- Hono
- TypeScript
- Zod
- `@hono/zod-validator`

### Database and storage

- SQLite
- MySQL
- PostgreSQL
- MongoDB
- Redis

### Background processing

- BullMQ
- Redis sebagai transport queue

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
