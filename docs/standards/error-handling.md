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
        ├── RateLimitError       -> 429 Too Many Requests
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

### 4. Database Driver Error Normalization (`src/database/errors.ts`)
The Global Error Handler and `errorTransformer.util.ts` normalize vendor-specific database driver exceptions into typed `AppError` instances:
- **Duplicate / Unique Violations** -> `ConflictError (409)`:
  - MySQL duplicate entry (`ER_DUP_ENTRY`)
  - PostgreSQL unique violation (`23505`)
  - MongoDB duplicate key (`code: 11000`)
  - SQLite unique constraint (`SQLITE_CONSTRAINT_UNIQUE`)
- **Foreign Key Violations** -> `ConflictError (409)`:
  - MySQL foreign key constraint fail (`ER_NO_REFERENCED_ROW_2`, `ER_ROW_IS_REFERENCED_2`)
  - PostgreSQL foreign key violation (`23503`)
  - SQLite foreign key constraint (`SQLITE_CONSTRAINT_FOREIGNKEY`)

### 5. Malformed JSON Body Handling
When incoming HTTP request bodies contain invalid JSON syntax, the parser error is caught and automatically transformed into a standardized `ValidationError (400 Bad Request)` with the message `"Malformed JSON body"`.

### 6. Standardized Error Response with Request ID
All error responses automatically attach the active `requestId` for distributed traceability:
```json
{
  "status": "error",
  "message": "Resource not found",
  "data": null,
  "requestId": "485b8bde-3563-42d1-aadb-ef97b2e3577d"
}
```

### 7. Logging Severity Levels
- **Operational Errors** (`4xx` such as `NotFoundError`, `ValidationError`): Logged at `WARN` level.
- **Unexpected System Errors** (`5xx`, unhandled exceptions): Logged at `ERROR` level along with full stack traces.

---

[Back to Standards](./README.md)
