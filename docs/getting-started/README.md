# Getting Started

Initial setup guides for running the skeleton locally and preparing for production deployment.

---

## 📚 Documents

1. **[Installation & Local Setup](./installation.md)**
   - Runtime version requirements (Bun `1.4.3` & Hono `^4.6.0`).
   - Single `.env` file configuration (Laravel-style convention).
   - Running the development server with Hono SSR + Tailwind CSS via Vite (`bun run dev:all`).
   - Running database migrations (`bun run migrate`) and seeders (`bun run seed`).

2. **[Deployment & Production](./deployment.md)**
   - Building CSS assets (`bun run build:css`) and standalone compiled binary (`bun run build:app`).
   - Running the API server (`./server` / `bun run server:bin:prod`) and worker (`./server --worker` / `bun run worker:bin:prod`).
   - Example Systemd service unit templates for Linux servers.

---

[Back to Documentation](../README.md)
