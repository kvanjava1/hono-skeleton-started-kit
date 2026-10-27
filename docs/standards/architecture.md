# Architecture Standard

This document defines the architectural layers, separation of concerns, and boundaries across the codebase.

---

## 🏛️ Architectural Layers

```text
src/
├── routes/          # Route definitions & mounters (Web & API)
├── validations/     # Zod request/params/query schemas (@hono/zod-openapi)
├── controllers/     # HTTP boundary (Web & API separated)
├── services/        # Pure business logic (agnostic of Hono Context)
├── repositories/    # Database queries & data access
├── database/
│   └── schema/      # Drizzle ORM table definitions
├── middlewares/     # HTTP middleware pipeline
├── utils/           # Shared utilities & helpers
├── queues/          # BullMQ queue wiring
├── jobs/            # Job definitions & handlers
└── workers/         # Background worker entry point
```

---

## 🔄 Layer Dependency Flows

### 1. API Flow (REST / OpenAPI)
```text
Client Request
      │
      ▼
Routes (`src/routes/api/`)
  └── Bind OpenAPI Spec & Validation Hook
      │
      ▼
Validations (`src/validations/`)
  └── Auto-validate Body/Params via Zod (Rejects invalid input with 400 automatically)
      │
      ▼
Controllers (`src/controllers/api/<domain>/`)
  └── Read validated input `c.req.valid()` -> Call Service -> Format JSON via `successResponse()`
      │
      ▼
Services (`src/services/<domain>/`)
  └── Domain logic, caching, throw `AppError` on invalid state
      │
      ▼
Repositories (`src/repositories/<domain>/`)
  └── Execute queries via Drizzle ORM / Native Client (Named Connection)
      │
      ▼
Database (SQLite / MySQL / Postgres / Mongo)
```

### 2. Web Flow (Hono JSX SSR)
```text
Client Request
      │
      ▼
Routes (`src/routes/web/`)
      │
      ▼
Controllers (`src/controllers/web/<domain>/`)
  └── Render Hono JSX (`resources/views/`)
      │
      ▼
HTML Response (with Tailwind CSS stylesheet link)
```

### 3. Background Job Flow (BullMQ Worker)
```text
Service / Controller
  └── Dispatch Job via Queue (`src/queues/`)
      │
      ▼
Redis (`redis1`)
      │
      ▼
Worker Process (`src/workers/`)
      │
      ▼
Job Handler (`src/jobs/<domain>/`)
      │
      ▼
Service Layer (`src/services/`)
```

---

## 📋 Layer Boundaries & Responsibilities

### 1. Routes (`src/routes/`)
- Sole responsibility is mapping URL paths, HTTP methods, route-level middlewares, and linking to Controllers.
- API routes utilize `OpenAPIHono` with `defaultHook: openApiValidationHook` from `src/utils/openapi.util.ts`.
- Sub-routers live within feature domains (e.g., `src/routes/api/example/crud.router.ts`) and are mounted inside `src/routes/api/index.ts`.

### 2. Validations (`src/validations/`)
- Powered by `@hono/zod-openapi` to automatically bind runtime schema validation to Swagger/Scalar OpenAPI specifications.
- All request parameters (params, query, body) and TypeScript inferred types live here.

### 3. Controllers (`src/controllers/`)
- Act as the HTTP boundary: parse input from requests and return HTTP responses.
- **Web Controllers** render JSX components (`return c.html(<View />)`).
- **API Controllers** read validated input via `c.req.valid("json")` or `c.req.valid("param")` and return JSON via `successResponse(c, message, data)`.
- **Prohibited**:
  - Direct database queries.
  - Manual `try/catch` wrapping for standard application errors (handled by the Global Error Handler).
  - Heavy business logic calculations.

### 4. Services (`src/services/`)
- Encapsulate all business logic, orchestrate across multiple repositories, integrate with cache, and dispatch background jobs.
- **Prohibited**:
  - Importing or referencing Hono `Context` (`c`).
  - Shaping HTTP JSON responses manually.
  - Returning hidden error objects; always throw typed `AppError` subclasses (`NotFoundError`, `ValidationError`, etc.).

### 5. Repositories (`src/repositories/`)
- Dedicated exclusively to database queries (SELECT, INSERT, UPDATE, DELETE).
- Use Drizzle ORM or native drivers according to the target database.
- Must specify named connections explicitly (e.g., `getDrizzleDb('sqlite1')` or `getMysqlPool('mysql1')`).

### 6. Database Schemas (`src/database/schema/`)
- Contain Drizzle ORM table definitions (distinct from request validation schemas).
- Organized by feature/domain (e.g., `src/database/schema/example/crud.schema.ts`).

---

[Back to Standards](./README.md)
