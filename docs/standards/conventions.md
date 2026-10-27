# Code Conventions

This document outlines file naming conventions, import guidelines, standard JSON response formatting, and logging patterns.

---

## 📁 File Naming & Domain Structure

All new features should be placed in dedicated sub-folders organized by domain (e.g., `product`, `order`, `example`).

| Component | Naming Format | Directory Path | Example |
|---|---|---|---|
| **Routes (API)** | `camelCase.router.ts` | `src/routes/api/<domain>/` | `crud.router.ts` |
| **Routes (Web)** | `camelCase.router.ts` | `src/routes/web/<domain>/` | `view.router.ts` |
| **Controllers (API)** | `camelCase.controller.ts` | `src/controllers/<domain>/api/` | `crud.controller.ts` |
| **Controllers (Web)** | `camelCase.controller.ts` | `src/controllers/<domain>/web/` | `view.controller.ts` |
| **Validations (Zod)** | `camelCase.ts` | `src/validations/<domain>/` | `crud.ts` |
| **Services** | `camelCase.service.ts` | `src/services/<domain>/` | `crud.service.ts` |
| **Repositories** | `camelCase.repository.ts` | `src/repositories/<domain>/` | `crud.repository.ts` |
| **DB Schemas (Drizzle)**| `camelCase.schema.ts` | `src/database/schema/<domain>/` | `crud.schema.ts` |
| **Views (Hono JSX)** | `PascalCase.tsx` | `resources/views/<domain>/` | `Index.tsx`, `Layout.tsx` |
| **Jobs** | `camelCase.job.ts` | `src/jobs/<domain>/` | `crudCreate.job.ts` |
| **Middlewares** | `camelCase.middleware.ts` | `src/middlewares/<group>/` | `rateLimiter.middleware.ts` |
| **Utils** | `camelCase.util.ts` | `src/utils/` | `logger.util.ts`, `response.util.ts` |
| **DB Connections** | `snake_case.connection.ts`| `src/database/` | `sqlite.connection.ts` |

---

## 📦 Import Rules

Bun and TypeScript in this project use explicit ESM paths:

```ts
// ✅ Always include the .ts extension on local imports
import * as CrudService from '../services/example/crud.service.ts';
import { successResponse } from '../../utils/response.util.ts';
import type { Context } from 'hono';

// ❌ Never omit file extensions
import * as CrudService from '../services/example/crud.service';
```

---

## 🎯 JSON Response Formatting (API)

Always use [`src/utils/response.util.ts`](file:///home/melodelavic/Documents/bun/hono-skeleton-started-kit/src/utils/response.util.ts). Avoid hand-rolling ad-hoc JSON response structures in controllers:

### Success Response
```ts
return successResponse(c, 'Products retrieved successfully', products, 200);
```

Produced payload:
```json
{
  "status": "success",
  "message": "Products retrieved successfully",
  "data": [ ... ]
}
```

### Error Response
Do not return `errorResponse` manually for anticipated errors. Simply throw the appropriate `AppError`:
```ts
throw new NotFoundError('Product with this ID was not found');
```
The Global Error Handler in [`src/middlewares/common/errorHandler.ts`](file:///home/melodelavic/Documents/bun/hono-skeleton-started-kit/src/middlewares/common/errorHandler.ts) will automatically format the response:
```json
{
  "status": "error",
  "message": "Product with this ID was not found",
  "data": null
}
```

---

## 📝 Logging Conventions

Use the singleton logger from [`src/utils/logger.util.ts`](file:///home/melodelavic/Documents/bun/hono-skeleton-started-kit/src/utils/logger.util.ts). Always prefix messages with a `[ModuleName]` tag:

```ts
// In Services
logger.info('[ProductService] Product created', { productId: 123 });

// In Queue / Worker
logger.info('[EmailJob] Processing email dispatch', { jobId: job.id });

// In Repositories / Database
logger.warn('[PaymentRepo] Connection retry triggered');
```

The logger parses the `[ModuleName]` tag into the structured `module` field in JSONL log files (`storages/logs/app/info.jsonl`).

---

[Back to Standards](./README.md)
