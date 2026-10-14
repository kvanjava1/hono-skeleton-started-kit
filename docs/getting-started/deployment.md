# Deployment

This project can be compiled into a Bun binary.

## Build

```bash
# Compile Tailwind CSS and its manifest
bun run build:css

# Compile the Hono server
bun run build
```

This creates a `server` binary in the project root. Deploy it together with the
`dist/` directory, which contains the compiled stylesheet and Vite manifest.

## Run

The binary auto-loads the `.env` file from its working directory — create a
`.env` with production values on the server (like Laravel: one `.env` per
machine).

API server:

```bash
./server
```

Worker mode:

```bash
./server --worker
```

Or use the available scripts in `package.json`:

```bash
bun run server:bin
bun run worker:bin
```

## Important Notes

- the binary reads configuration from the `.env` file in its working directory (and from environment variables in the process)
- `bun run server:code:prod` and `bun run worker:code:prod` follow `NODE_ENV` from `.env` or the process environment
- `bun run server:bin` and `bun run worker:bin` set `NODE_ENV=production`; other configuration still comes from `.env` or the process environment
- keep `storages/` available for logs and SQLite files
- if SQLite is enabled, the `sqlite1` path must exist or be creatable
- if Redis is enabled, it must be reachable before the app starts
- `./server` runs API mode
- `./server --worker` runs worker mode
- the production server reads the stylesheet path from `dist/.vite/manifest.json`
  and serves compiled assets from `dist/` at `/assets/`

## Example systemd unit

```ini
[Unit]
Description=Hono Multi-Database Skeleton
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/app
ExecStart=/path/to/app/server
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
ExecStart=/path/to/app/server --worker
Restart=always

[Install]
WantedBy=multi-user.target
```

[Back to Getting Started](./README.md)
