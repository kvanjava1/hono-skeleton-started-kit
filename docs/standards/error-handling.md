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

### Use `transformError()` for library and driver errors

Current global handler already normalizes:

- Zod validation errors
- duplicate errors from MySQL
- duplicate errors from PostgreSQL
- duplicate errors from MongoDB
- duplicate errors from SQLite

### Logging behavior

- operational errors -> `warn`
- unexpected system errors -> `error`

Request context is attached by the global error handler for easier debugging.
