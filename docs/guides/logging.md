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

- `info.txt`
- `debug.txt`
- `warning.txt`
- `errors.txt`

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
