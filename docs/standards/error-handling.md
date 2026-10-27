# Error Handling Standard

This document details the application's error class hierarchy, HTTP status code mappings, automated error normalization, and rules for error handling.

---

## 🌲 Error Class Hierarchy (`src/utils/errors.util.ts`)

All operational application errors extend `AppError` (which in turn extends Hono's `HTTPException`):

```text
HTTPException (Hono)
  └── AppError
        ├── ValidationError      -> 400 Bad Request
        ├── UnauthorizedError    -> 401 Unauthorized
        ├── InvalidTokenError    -> 401 Unauthorized
        ├── ForbiddenError       -> 403 Forbidden
        ├── NotFoundError        -> 404 Not Found
        ├── ConflictError        -> 409 Conflict
        ├── DuplicateOrderError  -> 409 Conflict
        ├── RateLimitError       -> 429 Too Many Requests
        ├── ScrapingError        -> 500 Internal Server Error
        └── DatabaseError        -> 500 Internal Server Error
```

---

## 🛡️ Error Handling Rules

### 1. Always Throw Errors from Services
Do not return boolean flags or error objects from services. Throw the appropriate `AppError` subclass when an invalid domain state occurs:

```ts
if (!user) {
  throw new NotFoundError('User with this email was not found');
}
```

### 2. Avoid Manual `try/catch` in Controllers
Controllers should not manually wrap service calls with `try/catch` blocks for standard application errors. Let them bubble up to the **Global Error Handler** (`src/middlewares/common/errorHandler.ts`).

### 3. Automated Route-Level Request Validation (`@hono/zod-openapi`)
OpenAPI routes attach `openApiValidationHook` (`src/utils/openapi.util.ts`) as the `defaultHook`. When incoming request bodies, params, or queries fail Zod schema validation:
- The request is immediately rejected with HTTP status **400 Bad Request**.
- The response is formatted into the standardized application error contract:
```json
{
  "status": "error",
  "message": "Validation failed",
  "data": {
    "target": "json",
    "errors": [
      {
        "field": "price",
        "message": "Expected number, received string"
      }
    ]
  }
}
```

### 4. Database Driver Error Normalization (`transformError`)
The Global Error Handler normalizes vendor-specific database driver exceptions into typed `AppError` instances:
- MySQL duplicate entry (`ER_DUP_ENTRY`) -> `ConflictError (409)`
- PostgreSQL unique violation (`23505`) -> `ConflictError (409)`
- MongoDB duplicate key (`code: 11000`) -> `ConflictError (409)`
- SQLite constraint violation (`SQLITE_CONSTRAINT`) -> `ConflictError (409)`

### 5. Logging Severity Levels
- **Operational Errors** (`4xx` such as `NotFoundError`, `ValidationError`): Logged at `WARN` level.
- **Unexpected System Errors** (`5xx`, unhandled exceptions): Logged at `ERROR` level along with full stack traces.

---

[Back to Standards](./README.md)
