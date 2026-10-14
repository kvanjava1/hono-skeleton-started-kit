# Conventions

## File Naming

| Layer | Format | Example |
|---|---|---|
| Routes | `camelCase.router.ts` | `product.router.ts` |
| Controllers | `camelCase.controller.ts` | `product.controller.ts` |
| Services | `camelCase.service.ts` | `product.service.ts` |
| Repositories | `camelCase.repository.ts` | `product.repository.ts` |
| Schemas | `camelCase.schema.ts` | `product.schema.ts` |
| Middlewares | `camelCase.middleware.ts` | `errorHandler.middleware.ts` |
| Utils | `snake_case.util.ts` | `logger.util.ts` |
| Jobs | `camelCase.job.ts` | `sendEmail.job.ts` |
| Database | `snake_case.connection.ts` | `sqlite.connection.ts` |

> [!NOTE]
> **Modular Structure**: New domain features should be placed in sub-folders (e.g., `src/controllers/product/`, `src/routes/api/product/`).
> **Router Mounting**: `src/routes/api/index.ts` should only mount sub-routers; route definitions live in their feature folder.
> **Hono JSX Views**: Put server-rendered `.tsx` views in `resources/views/`.
> **Tailwind CSS**: Add utility classes to JSX views and keep the stylesheet entry in `resources/css/app.css`.
> **Static Assets**: Put static files in the root `/public/` directory.

## Imports

Use:

```ts
import * as ProductService from '../services/product.service.ts';
import { logger } from '../utils/logger.util.ts';
import type { Context } from 'hono';
```

Always keep `.ts` extensions in imports.

## Response Shape

Use response utilities:

```ts
return successResponse(c, 'Products retrieved', data);
```

Do not hand-roll ad hoc success and error payloads in controllers.

## Connection Selection

When an engine supports named connections, choose the target explicitly in new code.

Examples:

```ts
getSqliteDb('sqlite1');
getMysqlPool('mysql1');
getMongoDb('mongo1');
getPgSql('pg1');
getRedis('redis1');
```

Avoid relying on compatibility defaults in new modules unless there is a clear reason.

## Logging

Use module prefixes:

```ts
logger.info('[ProductService] Product created');
logger.warn('[PaymentService] Payment is delayed');
logger.error('[SyncJob] Failed to sync', error);
```
