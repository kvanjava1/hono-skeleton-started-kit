# Make CLI (Code Generator)

This skeleton provides a CLI-based code generator (`scripts/make.ts`) inspired by Laravel Artisan to accelerate boilerplate scaffolding following our **domain-driven modular architecture**.

---

## 💻 Available Commands

```bash
# Complete Domain Scaffolding (Web + API + Service + Repo + Validation)
bun run make domain <domain>

# HTTP Boundary (Web & API separated; kind defaults to `api` when omitted)
bun run make controller api <domain> [name]
bun run make controller web <domain> [name]

# Logic & Data Layers (Domain-scoped)
bun run make service <domain> [name]
bun run make repository <domain> [name]
bun run make validation <domain> [name]    # Alias: bun run make schema <domain> [name]

# Database Migrations & Seeders
bun run make migration <target> <name>
bun run make seeder <target> <name>

# Background Jobs & Mail
bun run make job <name>
bun run make mail <name>
```

### Supported Database Targets (Migrations & Seeders):
- `sqlite`
- `mysql`
- `pg`
- `mongo`

---

## 📋 Complete Usage Examples

### 1. Scaffold a Complete Domain Bundle
```bash
bun run make domain article
```
*Output*:
- `src/controllers/api/article/article.controller.ts` (API JSON endpoint)
- `src/controllers/web/article/article.controller.ts` (Web handler — the stub still returns an HTML echo via `c.html()`; replace it with `c.render(...)` per [Inertia Patterns](../standards/inertia-patterns.md) when you build real pages)
- `src/routes/api/article/article.router.ts` (OpenAPI sub-router)
- `src/routes/web/article/article.router.ts` (Web sub-router, paths resolved from the registry)
- `src/services/article/article.service.ts` (Business logic)
- `src/repositories/article/article.repository.ts` (Data access)
- `src/validations/article/article.validation.ts` (Zod validation)
- `src/configs/routes.config.ts` — inserts a `ROUTES.WEB.ARTICLE` block above the `[make:web-domain]` marker, so the generated web router resolves paths from the route registry instead of string literals

### 2. Create Controllers (API vs Web)
```bash
# API Controller (JSON) — the default when kind is omitted
bun run make controller api product
# Output: src/controllers/api/product/product.controller.ts

# Web Controller (currently an HTML echo stub — swap to c.render for real pages)
bun run make controller web product
# Output: src/controllers/web/product/product.controller.ts
```

### 3. Create a Service
```bash
bun run make service product
```
*Output*: `src/services/product/product.service.ts`

### 4. Create a Repository
```bash
bun run make repository product
```
*Output*: `src/repositories/product/product.repository.ts`

### 5. Create a Request Validation Schema (Zod + OpenAPI)
```bash
bun run make validation product
```
*Output*: `src/validations/product/product.validation.ts`
Generates a pre-configured `@hono/zod-openapi` schema with ready-to-use parameter and body schemas.

> **Naming note:** the generator appends a `.validation` suffix, while existing
> hand-written validations follow `src/validations/<domain>/<name>.ts` without
> any suffix (e.g. `src/validations/admin/user.ts`). Rename the generated
> file (and its imports) if you want to match the codebase convention.

### 6. Create a Migration
```bash
bun run make migration sqlite create_products
```
*Output*: `scripts/migrations/sqlite/files/<timestamp>_create_products.ts`  
Generated files include `up` and `down` method templates and target `sqlite1` by default.

### 7. Create a Seeder
```bash
bun run make seeder pg ProductSeeder
```
*Output*: `scripts/seeders/pg/ProductSeeder.ts`

### 8. Create a Background Job
```bash
bun run make job ProcessReport
```
*Output*: `src/jobs/processReport.job.ts`
Generates a BullMQ queue factory and an asynchronous job processor. The
generator writes to the `src/jobs/` root; existing jobs are organized in
domain subfolders (`src/jobs/example/`, `src/jobs/mail/`) — move the file and
adjust its relative imports if you follow that layout.

### 9. Create a Mailable & JSX Template
```bash
bun run make mail WelcomeNotification
```
*Output*:
- `src/mail/WelcomeNotification.mail.ts` (Mailable class)
- `resources/views/emails/WelcomeNotificationEmail.tsx` (Hono JSX responsive email template)

---

[Back to Guides](../README.md)
