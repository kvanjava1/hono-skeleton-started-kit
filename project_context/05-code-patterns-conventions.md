# 05 Code Patterns Conventions

## Existing Architectural Rule

Aturan utama dari docs:

`Routes -> Controllers -> Services -> Repositories -> Database`

Prinsipnya sehat dan perlu dipertahankan saat modul domain pertama dibuat.

## File Naming Conventions

Berdasarkan dokumentasi:

- routes: `camelCase.routes.ts`
- controllers: `camelCase.controller.ts` atau `snake_case.controller.ts`
- services: `camelCase.service.ts` atau `snake_case.service.ts`
- repositories: `camelCase.repository.ts`
- schemas: `camelCase.schema.ts` atau `snake_case.schema.ts`
- middlewares: `camelCase.middleware.ts`
- utils: `snake_case.util.ts`
- jobs: `PascalCase.job.ts`
- database connection: `snake_case.connection.ts`

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
- MySQL: `mysql1`, `mysql2`
- MongoDB: `mongo1`, `mongo2`
- Redis: `redis1`, `redis2`
- PostgreSQL: `pg1`, `pg2`

Praktik yang disarankan:

- repository SQLite: `getSqliteDb('sqlite1')`
- repository MySQL: `getMysqlPool('mysql1')`
- repository MongoDB: `getMongoDb('mongo1')`
- repository PostgreSQL: `getPgSql('pg1')`
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

- [src/utils/response.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/response.util.ts)
- [src/utils/errors.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/errors.util.ts)
- [src/utils/logger.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/logger.util.ts)
- [src/utils/cache.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/cache.util.ts)
- [src/utils/context.util.ts](/home/melodelavic/Documents/bun/hono-skeleton/src/utils/context.util.ts)

Sebelum menambah helper baru, area ini wajib dicek dulu.

## Real Convention Gaps

Ada beberapa gap antara docs, generator, dan implementasi nyata:

### Service and repository placement

Docs API pattern memberi contoh file flat seperti:

- `src/services/payment.service.ts`
- `src/repositories/payment.repository.ts`

Tetapi generator `scripts/make.ts` membuat struktur:

- `src/services/sqlite/*.ts`
- `src/services/mysql/*.ts`
- `src/repositories/sqlite/*.ts`
- `src/repositories/mysql/*.ts`

Artinya standard final belum benar-benar fixed.

### Connection defaults vs explicit targeting

Codebase sekarang masih menyediakan compatibility default untuk:

- `getMysqlPool()` -> `mysql1`
- `getMongoDb()` -> `mongo1`
- `getRedis()` -> `redis1`
- `getPgSql()` -> `pg1`

Namun untuk kode baru, explicit targeting tetap lebih aman.

### Routes

Docs menyarankan file route modular, dan implementasi saat ini sudah mulai bergerak ke arah itu lewat `src/routes/example.routes.ts` yang kemudian diregistrasikan dari `src/routes/index.ts`.

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
