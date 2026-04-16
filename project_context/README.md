# Project Context

Dokumen konteks proyek dipecah per kategori agar lebih mudah dipakai saat discovery, planning, dan implementasi.

## Index

- [01-overview.md](./01-overview.md)
- [02-architecture-structure.md](./02-architecture-structure.md)
- [03-technical-deep-dive.md](./03-technical-deep-dive.md)
- [04-business-logic-analysis.md](./04-business-logic-analysis.md)
- [05-code-patterns-conventions.md](./05-code-patterns-conventions.md)
- [06-dependencies-integrations.md](./06-dependencies-integrations.md)
- [07-development-operations.md](./07-development-operations.md)
- [08-risks-insights.md](./08-risks-insights.md)

## Reading Order

1. Mulai dari `01-overview.md` untuk memahami tujuan repo dan stack dasarnya.
2. Lanjut ke `02-architecture-structure.md` untuk melihat bentuk sistem dan struktur folder.
3. Gunakan `03-technical-deep-dive.md` saat butuh detail route, middleware, database, queue, worker, dan named connection model.
4. Baca `05-code-patterns-conventions.md` sebelum menambah file atau menulis implementasi baru.
5. Selalu cek `08-risks-insights.md` sebelum refactor atau perubahan fondasi.

## Current Understanding

Repo ini adalah skeleton backend `Bun + Hono` dengan dukungan multi-database, queue worker, logging, migration, seeder, dan generator file. Saat ini repo sudah mendukung **named multi-connections** untuk seluruh engine utama:

- SQLite: `sqlite1`
- MySQL: `mysql1`, `mysql2`
- MongoDB: `mongo1`, `mongo2`
- Redis: `redis1`, `redis2`
- PostgreSQL: `pg1`, `pg2`

Arsitektur domain sudah diarahkan. Repo ini tidak membawa domain bisnis nyata sebagai bawaan, tetapi saat ini menyertakan modul referensi netral `example` sebagai executable reference untuk pola CRUD, queue, cache, migration, dan testing.
