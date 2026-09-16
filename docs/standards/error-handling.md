# Error Handling

## Error Class Hierarchy

```text
HTTPException
  └── AppError
        ├── ValidationError
        ├── UnauthorizedError
        ├── InvalidTokenError
        ├── ForbiddenError
        ├── NotFoundError
        ├── ConflictError
        ├── DuplicateOrderError
        ├── RateLimitError
        ├── ScrapingError
        └── DatabaseError
```

## Current Status Codes

- `ValidationError` -> `400`
- `UnauthorizedError` -> `401`
- `InvalidTokenError` -> `401`
- `ForbiddenError` -> `403`
- `NotFoundError` -> `404`
- `ConflictError` -> `409`
- `RateLimitError` -> `429`

## Rules

### Throw in services when possible

```ts
if (!product) {
  throw new NotFoundError('Product not found');
}
```

### Let the global error handler normalize responses

Controllers should not manually catch and remap expected application errors.

### Route-level validation errors

`@hono/zod-openapi` validates requests automatically from the schemas attached to
`createRoute`. Failures are normalized by `openApiValidationHook`
(`src/utils/openapi.util.ts`), wired as `defaultHook`, and return `400` with the
standard `{ status, message, data }` contract.

### Use `transformError()` for library and driver errors

Current global handler already normalizes:

- Zod validation errors thrown from services
- duplicate errors from MySQL
- duplicate errors from PostgreSQL
- duplicate errors from MongoDB
- duplicate errors from SQLite

### Logging behavior

- operational errors -> `warn`
- unexpected system errors -> `error`

Request context is attached by the global error handler for easier debugging.
