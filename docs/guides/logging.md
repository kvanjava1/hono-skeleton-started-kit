# Logging

The project uses a file-based logger with console output.

## Directory Layout

```text
storages/logs/
├── app/
├── cli/
└── queue/
```

Each service gets date-based folders and files like:

- `info.jsonl`
- `debug.jsonl`
- `warning.jsonl`
- `errors.jsonl`

## Format

### File (JSON Lines — `.jsonl`)

One JSON object per line:

```jsonl
{"time":"2026-06-20T09:44:21.000Z","level":"INFO","service":"app","reqId":"abc-123","module":"CrudService","msg":"Crud created"}
{"time":"2026-06-20T09:44:22.000Z","level":"ERROR","service":"app","reqId":"abc-123","module":"App","msg":"Database error","data":{"message":"Connection refused","name":"Error","stack":"Error: Connection refused\n    at ..."}}
```

| Field | Required | Description |
|-------|----------|-------------|
| `time` | ✅ | ISO 8601 UTC |
| `level` | ✅ | DEBUG / INFO / WARN / ERROR |
| `service` | ✅ | app / queue / cli |
| `reqId` | ❌ | Request ID from AsyncLocalStorage |
| `module` | ❌ | Parsed from `[ModuleName]` message prefix |
| `msg` | ✅ | Log message |
| `data` | ❌ | Error → `{message, name, stack}`, object → deep-copy, primitive → string |

### Console (human-readable)

```
[2026-06-20 09:44:21] [INFO] [ID: abc-123] Crud created
```

## Request Logging

Every HTTP request (API and web) produces one completion log line:

```json
{
  "level": "INFO",
  "service": "app",
  "reqId": "9f8c1e2a-...",
  "module": "Http",
  "msg": "Request completed",
  "data": {
    "method": "GET",
    "path": "/api/health",
    "status": 200,
    "durationMs": 12,
    "ip": "10.0.0.1"
  }
}
```

- `durationMs` is measured from `requestStartedAt` in the request context, so it
  matches the metrics histogram (`http_request_duration_ms_sum`).
- Requests to `/metrics` are skipped to avoid log noise.

Queue jobs are logged as `[Queue] Job completed` / `[Queue] Job failed` with
`queue` and `jobId`. The worker keeps the original `reqId` (propagated through
the job payload).

Business logs use module prefixes, e.g. `[CrudService] Crud created`.

## Redaction

Sensitive keys are replaced with `[REDACTED]` before writing: `password`,
`passwd`, `token`, `authorization`, `secret`, `cookie`, `apikey`, `creditcard`
— including inside nested objects and arrays.

## Log Levels

- `debug`
- `info`
- `warn`
- `error`

Minimum level is configured via:

```env
LOG_LEVEL=info
```

Only messages at or above this level are written. Invalid values fall back to
`info`.

## Retention

Configured by:

```env
LOG_RETENTION_DAYS=3
```

## Usage

```ts
import { logger } from '../utils/logger.util.ts';

logger.info('Server started');
logger.warn('Rate limit reached');
logger.error('Unexpected failure', error);
```

## Read-only Environments

If the filesystem is read-only, file logging can fail. The logger is designed to avoid crashing request handling and will still log to console.

[Back to Docs](../README.md)
