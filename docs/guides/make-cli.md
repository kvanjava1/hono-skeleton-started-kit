# Make CLI (Code Generator)

This skeleton provides a CLI-based code generator (`scripts/make.ts`) inspired by Laravel Artisan to accelerate boilerplate scaffolding.

---

## 💻 Available Commands

```bash
# Database & Seeders
bun run make migration <target> <name>
bun run make seeder <target> <name>

# Logic & HTTP Layers
bun run make controller <name>
bun run make service <target> <name>
bun run make repository <target> <name>

# Validation & Queues
bun run make validation <name>    # Alias: bun run make schema <name>
bun run make job <name>
```

### Supported Database Targets:
- `sqlite`
- `mysql`
- `pg`
- `mongo`

---

## 📋 Complete Usage Examples

### 1. Create a Migration
```bash
bun run make migration sqlite create_products
```
*Output*: `scripts/migrations/sqlite/files/<timestamp>_create_products.ts`  
Generated files include `up` and `down` method templates and target `sqlite1` by default.

### 2. Create a Seeder
```bash
bun run make seeder pg ProductSeeder
```
*Output*: `scripts/seeders/pg/ProductSeeder.ts`

### 3. Create a Controller
```bash
bun run make controller Product
```
*Output*: `src/controllers/product.controller.ts`

> [!TIP]
> For domain modules, organize controllers inside sub-directories:
> - `src/controllers/product/api/product.controller.ts` (for JSON APIs)
> - `src/controllers/product/web/product.controller.ts` (for SSR JSX Views)

### 4. Create a Service
```bash
bun run make service sqlite Product
```
*Output*: `src/services/sqlite/Product.service.ts`

### 5. Create a Repository
```bash
bun run make repository sqlite Product
```
*Output*: `src/repositories/sqlite/Product.repository.ts`

### 6. Create a Request Validation Schema (Zod + OpenAPI)
```bash
bun run make validation Product
```
*Output*: `src/validations/product.ts`  
Generates a pre-configured `@hono/zod-openapi` schema with ready-to-use parameter and body schemas.

### 7. Create a Background Job
```bash
bun run make job SendEmail
```
*Output*: `src/jobs/SendEmail.job.ts`  
Generates a BullMQ queue factory and an asynchronous job processor.

---

[Back to Guides](../README.md)
