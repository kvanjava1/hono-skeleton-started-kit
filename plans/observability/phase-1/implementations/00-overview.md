# 00 — Overview Logging & Correlation

> **Versi:** 2.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** ✅ Selesai
> **Perubahan:** Dipersempit ke logging; health/metrics/tracing punya dokumen sendiri

Gambaran umum phase-1 (logging & correlation): requirement, arsitektur, dan
risiko.

---

## 1. Tujuan

Membuat log lebih rapi, aman, dan dapat diolah mesin, tanpa menambah dependency.
Ini fondasi untuk phase berikutnya karena semua pilar observability menumpang
`reqId` dan pola log ini.

---

## 2. Requirements

### Functional

- **REQ-01** — Level log dapat diatur lewat `LOG_LEVEL` (`debug|info|warn|error`).
- **REQ-02** — Data sensitif disamarkan sebelum ditulis ke log.
- **REQ-03** — Satu baris log terstruktur per request (`method`, `path`,
  `status`, `durationMs`).
- **REQ-04** — Job queue mencatat `jobId` dan `queue` sebagai field, dan `reqId`
  diteruskan dari request ke worker.
- **REQ-05** — Modul example CRUD mencatat business event (created/updated/
  deleted/not found) dengan prefix `[CrudService]`.

### Non-Functional

- **NFR-01 (Performance)** — Logging tidak memblokir event loop; redaksi murah.
- **NFR-02 (Security)** — Tidak ada secret/PII yang bocor ke log.
- **NFR-03 (Compatibility)** — Perubahan log bersifat aditif; field lama
  dipertahankan.

### Out of Scope

- Health & readiness → [phase-2](../../phase-2/).
- Metrics → [phase-3](../../phase-3/).
- Tracing → [phase-4](../../phase-4/).

---

## 3. System Context

```text
Client → Middleware (requestId, context, rate limiter, request log)
       → Controller → Service → Repository → Database/Redis/Queue

Semua log memakai `reqId` yang sama dari AsyncLocalStorage.
Worker queue memakai `reqId` yang diteruskan lewat payload job.
```

---

## 4. Data Model

**N/A** — tidak ada perubahan skema database.

---

## 5. File yang Disentuh

| File | Jenis |
|---|---|
| `src/configs/app.config.ts` | Tambah `logLevel` |
| `src/utils/logger.util.ts` | Filter level + redaksi |
| `src/middlewares/common/logger.middleware.ts` | Log request terstruktur |
| `src/queues/base.queue.ts` | Field `jobId`/`queue` |
| `src/jobs/example/crudCreate.job.ts` | `requestId` di payload |
| `src/workers/index.ts` | Jalankan processor dalam request context |
| `src/services/example/crud.service.ts` | Log business event CRUD |
| `tests/unit/logger.test.ts` | **Baru** |

---

## 6. Testing Strategy

- **Unit** — filter `LOG_LEVEL`; redaksi (termasuk objek bersarang).
- **Integration** — E2E queue + Redis (propagasi `reqId` ke worker).
- **Regression** — `bun test`, `bun run typecheck`.

---

## 7. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Format log berubah | Parser rusak | Aditif; field lama dipertahankan |
| Redaksi salah | Sulit debug | Daftar key eksplisit + unit test |

---

## 8. Rollback Plan

Revert commit. Tidak ada migration. `LOG_LEVEL` dapat diubah lewat `.env` tanpa
deploy.

---

## 9. Pertanyaan Terbuka

- [ ] Default `LOG_LEVEL` production: `info` cukup?
