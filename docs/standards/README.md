# Standards & Engineering Rules

Refer to this section when authoring new code, refactoring existing modules, or adding endpoints and features to this repository.

---

## 📚 Standard Documents

1. **[Architecture Standard](./architecture.md)**
   - Architectural layers (`Routes -> Validations -> Controllers -> Services -> Repositories -> Database`).
   - Clear boundaries between Web SSR (Hono JSX) and REST API (OpenAPI).
   - BullMQ background worker architecture.

2. **[Code Conventions](./conventions.md)**
   - Per-layer file naming conventions.
   - ESM import rules (explicit `.ts` extensions).
   - Standard JSON response formatting (`successResponse`).
   - Structured logging conventions with `[ModuleName]` tags.

3. **[API Patterns & New Module Guide](./api-patterns.md)**
   - Step-by-step development flow: Migration, Drizzle Schema, Zod Validation, Repository, Service, and OpenAPI Route.

4. **[Error Handling](./error-handling.md)**
   - `AppError` class hierarchy and HTTP status code mappings.
   - Automatic `@hono/zod-openapi` validation error normalization via `openApiValidationHook`.
   - Third-party database driver error translation.

---

## 🌟 Golden Rules

1. **Never Access `process.env` Directly**: Always use typed getters and configs from `src/configs/env.ts` or `src/configs/index.ts`.
2. **Prefer Functions Over Classes**: Export pure functions unless an interface or stateful abstraction specifically demands a class.
3. **HTTP Boundary Separation**:
   - Controllers handle HTTP input/output only (`successResponse` or JSX rendering).
   - Services contain pure business logic and must never import or access Hono `Context`.
4. **Explicit Connection Targeting**: Repositories, migrations, and seeders must explicitly specify connection names (e.g., `getDrizzleDb('sqlite1')`, `getMysqlPool('mysql1')`).
5. **No Hidden Error Returns**: Never return error indicator objects (e.g. `{ error: true }`) from services; always throw `AppError` subclasses (`NotFoundError`, `ValidationError`, etc.).

---

[Back to Documentation](../README.md)
