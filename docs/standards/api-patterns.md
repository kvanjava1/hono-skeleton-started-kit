# API Patterns & Module Development Guide

This guide walks through adding a production-ready API feature step-by-step using `@hono/zod-openapi` and Drizzle ORM.

---

## 🚀 Recommended Development Flow

The recommended order for implementing a new domain module:

```text
1. Migration          ──> Create database tables
2. DB Table Schema    ──> Define Drizzle ORM schema
3. Request Validation ──> Author Zod validation schemas (@hono/zod-openapi)
4. Repository         ──> Write queries using explicit named connections
5. Service            ──> Implement business logic, cache, and validation rules
6. Controller         ──> Connect request inputs to services & successResponse
7. Route Registration ──> Attach createRoute OpenAPI definitions to sub-routers
8. Optional: Job      ──> Offload heavy/async background tasks to BullMQ
```

---

## Step 1: Database Migration

Generate a migration file for the targeted database engine (e.g., SQLite):

```bash
bun run make migration sqlite create_products
```

A migration file will be created in `scripts/migrations/sqlite/files/<timestamp>_create_products.ts`:

```ts
import type { SqliteMigration } from '../runner.ts';
import type { Database } from 'bun:sqlite';

export const name = '20261027_create_products';
export const target: SqliteMigration['target'] = 'sqlite1'; // Explicit connection target

export const up = async (db: Database): Promise<void> => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
};

export const down = async (db: Database): Promise<void> => {
  db.run(`DROP TABLE IF EXISTS products;`);
};
```

Run the migration:
```bash
bun run migrate sqlite
```

---

## Step 2: Database Table Schema (Drizzle ORM)

Define the table in `src/database/schema/product/product.schema.ts`:

```ts
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const productsTable = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').notNull(),
  stock: integer('stock').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type ProductEntity = typeof productsTable.$inferSelect;
export type NewProductEntity = typeof productsTable.$inferInsert;
```

---

## Step 3: Request Validation (Zod + OpenAPI)

Define input validation schemas in `src/validations/product/product.ts`:

```ts
import { z } from '@hono/zod-openapi';

export const ProductIdParam = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({ example: 1, description: 'Product ID (positive integer)' }),
});

export const CreateProductBody = z.object({
  name: z
    .string()
    .min(1)
    .openapi({ example: 'Wireless Mouse', description: 'Product title or name' }),
  price: z
    .number()
    .positive()
    .openapi({ example: 29.99, description: 'Product price' }),
  stock: z
    .number()
    .int()
    .nonnegative()
    .default(0)
    .openapi({ example: 100, description: 'Available inventory stock' }),
});

export type ProductIdParamInput = z.infer<typeof ProductIdParam>;
export type CreateProductBodyInput = z.infer<typeof CreateProductBody>;
```

> [!TIP]
> This schema is used by `@hono/zod-openapi` for both runtime request validation and Swagger/Scalar documentation at `/api/docs`.

---

## Step 4: Repository

Create the data access layer in `src/repositories/product/product.repository.ts`:

```ts
import { eq, desc } from 'drizzle-orm';
import { getDrizzleDb } from '../../database/drizzle.ts';
import { productsTable, type ProductEntity, type NewProductEntity } from '../../database/schema/product/product.schema.ts';

const getDb = () => getDrizzleDb('sqlite1'); // Explicit target connection

export const findAll = async (): Promise<ProductEntity[]> => {
  return await getDb().select().from(productsTable).orderBy(desc(productsTable.createdAt));
};

export const findById = async (id: number): Promise<ProductEntity | null> => {
  const [row] = await getDb().select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  return row ?? null;
};

export const insert = async (data: NewProductEntity): Promise<ProductEntity> => {
  const [row] = await getDb().insert(productsTable).values(data).returning();
  return row;
};
```

---

## Step 5: Service

Implement business logic in `src/services/product/product.service.ts`:

```ts
import * as ProductRepo from '../../repositories/product/product.repository.ts';
import { NotFoundError } from '../../utils/errors.util.ts';
import { logger } from '../../utils/logger.util.ts';
import type { CreateProductBodyInput } from '../../validations/product/product.ts';

export const getAllProducts = async () => {
  return await ProductRepo.findAll();
};

export const getProductById = async (id: number) => {
  const product = await ProductRepo.findById(id);
  if (!product) {
    throw new NotFoundError(`Product #${id} was not found`);
  }
  return product;
};

export const createProduct = async (input: CreateProductBodyInput) => {
  logger.info('[ProductService] Creating product', { name: input.name });
  const product = await ProductRepo.insert(input);
  return product;
};
```

---

## Step 6: Controller

Implement HTTP boundary handlers in `src/controllers/product/api/product.controller.ts`:

```ts
import type { Context } from 'hono';
import * as ProductService from '../../../services/product/product.service.ts';
import { successResponse } from '../../../utils/response.util.ts';
import type { ProductIdParamInput, CreateProductBodyInput } from '../../../validations/product/product.ts';

export const listProducts = async (c: Context) => {
  const products = await ProductService.getAllProducts();
  return successResponse(c, 'Products retrieved successfully', products);
};

export const getProduct = async (c: Context) => {
  const { id } = c.req.valid('param' as never) as ProductIdParamInput;
  const product = await ProductService.getProductById(id);
  return successResponse(c, 'Product retrieved successfully', product);
};

export const createProduct = async (c: Context) => {
  const body = c.req.valid('json' as never) as CreateProductBodyInput;
  const product = await ProductService.createProduct(body);
  return successResponse(c, 'Product created successfully', product, 201);
};
```

---

## Step 7: Route Definition & Registration

Create the sub-router in `src/routes/api/product/product.router.ts`:

```ts
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { listProducts, getProduct, createProduct } from '../../../controllers/product/api/product.controller.ts';
import { ProductIdParam, CreateProductBody } from '../../../validations/product/product.ts';
import { openApiValidationHook } from '../../../utils/openapi.util.ts';

export const productRouter = new OpenAPIHono({
  defaultHook: openApiValidationHook,
});

// GET /api/products
productRouter.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Products'],
    summary: 'List all products',
    responses: {
      200: { description: 'Products retrieved successfully' },
    },
  }),
  listProducts
);

// POST /api/products
productRouter.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Products'],
    summary: 'Create a new product',
    request: {
      body: {
        content: {
          'application/json': { schema: CreateProductBody },
        },
      },
    },
    responses: {
      201: { description: 'Product created successfully' },
      400: { description: 'Validation error' },
    },
  }),
  createProduct
);
```

Mount the router inside `src/routes/api/index.ts`:

```ts
import { productRouter } from './product/product.router.ts';

apiRoutes.route('/products', productRouter);
```

Your endpoint now automatically:
1. Validates incoming requests at runtime (returning a standardized 400 error if input fails schema validation).
2. Registers itself on the interactive OpenAPI documentation at `GET /api/docs`.
3. Adheres to the standard response contract `{ status, message, data }`.

---

[Back to Standards](./README.md)
