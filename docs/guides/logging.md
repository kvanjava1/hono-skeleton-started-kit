# Logging Guide

The application features a structured JSON logger with dual output: **buffered JSONL files** for automated machine ingestion and **clean, human-readable terminal output** for local debugging.

---

## 📂 Log Directory Layout

Log files are stored under `storages/logs/` and partitioned by service name (`SERVICE_NAME`):

```text
storages/logs/
├── app/                  # HTTP API & Web Server logs (SERVICE_NAME=app)
│   └── 2026-10-27/
│       ├── info.jsonl
│       ├── debug.jsonl
│       ├── warning.jsonl
│       └── errors.jsonl
├── queue/                # Background Worker logs (SERVICE_NAME=queue)
└── cli/                  # Migration & Seeder CLI logs (SERVICE_NAME=cli)
```

---

## 📝 Log Formats

### 1. File Format (JSON Lines — `.jsonl`)
Every log line is a standalone, compressed JSON object:

```jsonl
{"time":"2026-10-27T05:51:02.000Z","level":"INFO","service":"app","reqId":"18b205f0-...","module":"Http","msg":"Request completed","data":{"method":"GET","path":"/api/health","status":200,"durationMs":13,"ip":"127.0.0.1"}}
```

| Field | Required | Description |
|---|---|---|
| `time` | ✅ | ISO 8601 UTC timestamp |
| `level` | ✅ | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `service` | ✅ | `app`, `queue`, or `cli` |
| `reqId` | ❌ | Unique Request ID from `AsyncLocalStorage` (`requestContext`) |
| `module` | ❌ | Automatically parsed from the `[ModuleName]` prefix in log messages |
| `msg` | ✅ | Message description |
| `data` | ❌ | Structured metadata, stack traces, or sanitized payloads |

### 2. Console Format (Human-Readable)
```text
[2026-10-27 12:51:02] [INFO] [ID: 18b205f0-...] [Http] Request completed { method: "GET", path: "/api/health", status: 200, durationMs: 13 }
```

---

## 🔒 Automated Sensitive Data Redaction

The logger automatically sanitizes keys containing sensitive credentials into `[REDACTED]`, including:
- `password`, `token`, `secret`, `authorization`, `credit_card`, `api_key`

---

## 💻 Application Usage

Import the singleton `logger` from `src/utils/logger.util.ts`:

```ts
import { logger } from '../../utils/logger.util.ts';

// INFO: Standard business activity
logger.info('[UserService] User created successfully', { userId: 42 });

// WARN: Recoverable abnormalities
logger.warn('[PaymentService] Payment gateway slow response', { retryCount: 2 });

// ERROR: Fatal failures or unhandled exceptions
logger.error('[SyncService] Failed to sync data', err);

// DEBUG: Verbose technical data (only logged when LOG_LEVEL=debug)
logger.debug('[RedisCache] Cache miss for key: user:42');
```

---

## ⚙️ Environment Configuration (`.env`)

```env
LOG_LEVEL=info    # Options: debug | info | warn | error (default: info)
```

---

[Back to Guides](../README.md)
