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

## Log Levels

- `debug`
- `info`
- `warn`
- `error`

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
