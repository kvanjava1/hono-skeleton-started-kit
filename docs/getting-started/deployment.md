# Deployment

This project can be compiled into a Bun binary.

## Build

```bash
bun run build
```

This creates a `server` binary in the project root.

## Run

API server:

```bash
./server
```

Worker mode:

```bash
./server --worker
```

With explicit production env loaded from `.env.prod`:

```bash
env $(cat .env.prod | grep -v '^#' | xargs) ./server
env $(cat .env.prod | grep -v '^#' | xargs) ./server --worker
```

Or use the available scripts in `package.json`:

```bash
bun run server:bin:prod
bun run worker:bin:prod
```

## Important Notes

- the binary reads configuration from environment variables in the process
- there is no internal `.env` loader when the binary runs
- `.env.prod` must be loaded into the environment before starting the binary
- keep `storages/` available for logs and SQLite files
- if SQLite is enabled, the `sqlite1` path must exist or be creatable
- if Redis is enabled, it must be reachable before the app starts
- `./server` runs API mode
- `./server --worker` runs worker mode

## Example systemd unit

```ini
[Unit]
Description=Hono Multi-Database Skeleton
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/app
ExecStart=/bin/bash -lc 'env $(cat .env.prod | grep -v "^#" | xargs) ./server'
Restart=always

[Install]
WantedBy=multi-user.target
```

Worker unit example:

```ini
[Unit]
Description=Hono Multi-Database Skeleton Worker
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/app
ExecStart=/bin/bash -lc 'env $(cat .env.prod | grep -v "^#" | xargs) ./server --worker'
Restart=always

[Install]
WantedBy=multi-user.target
```

[Back to Getting Started](./README.md)
