# 00 — Overview Health & Readiness

> **Versi:** 1.0.0
> **Terakhir diperbarui:** 2026-09-11
> **Status:** ✅ Selesai

## 1. Tujuan

Menyediakan endpoint yang menunjukkan apakah aplikasi **siap** menerima trafik,
berdasarkan kondisi dependency yang aktif.

## 2. Requirements

### Functional

- **REQ-H01** — `GET /api/health` (liveness) tetap berfungsi seperti sekarang.
- **REQ-H02** — `GET /api/health/ready` (readiness) memeriksa dependency aktif.
- **REQ-H03** — Respons memuat daftar `checks` dengan `name`, `status`,
  `latencyMs`, dan `error` (bila gagal).
- **REQ-H04** — `200` bila semua `up`; `503` bila ada yang `down`.

### Non-Functional

- **NFR-H01** — Setiap pengecekan dibatasi timeout (mis. 2 detik).
- **NFR-H02** — Readiness tidak boleh melempar exception yang tidak tertangani.
- **NFR-H03** — Liveness tidak boleh terpengaruh kegagalan dependency.

### Out of Scope

- Metrics (phase-3) dan tracing (phase-4).
- Perubahan skema database.

## 3. Desain

```text
GET /api/health        → 200 { uptime, timestamp }        (liveness, tetap)
GET /api/health/ready  → 200/503 { checks: [...] }        (baru)

checkDatabaseReadiness()
  ├─ untuk tiap engine aktif (configApp.db.*):
  │    jalankan testAll*Connections() dengan timeout
  └─ kumpulkan { name, status, latencyMs, error? }
```

## 4. File yang Akan Disentuh

| File | Jenis |
|---|---|
| `src/database/index.ts` | Tambah `checkDatabaseReadiness()` |
| `src/configs/routes.config.ts` | Tambah `ROUTES.API.HEALTH_READY` |
| `src/routes/api/index.ts` | Tambah route `/api/health/ready` |
| `tests/health.test.ts` | Tambah test readiness |

## 5. Testing Strategy

- Integration: `/api/health` tetap sama; `/api/health/ready` → `200` saat
  dependency sehat, `503` saat ada yang mati (disimulasikan).
- Edge case: dependency menggantung → timeout memaksa `down`.
- Regression: `bun test`, `bun run typecheck`.

## 6. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Readiness menggantung | Load balancer menunggu | Timeout pendek |
| False 503 | Instance ditarik padahal sehat | Hanya cek dependency aktif; timeout wajar |
| Endpoint terekspos | Info internal | Dokumentasikan perlindungan di production |

## 7. Rollback Plan

Revert commit. Tidak ada perubahan data. `/api/health` lama tidak tersentuh.

## 8. Pertanyaan Terbuka

- [ ] Perlukah `/api/health/ready` dilindungi di production?
- [ ] Timeout yang pas: 2 detik?
