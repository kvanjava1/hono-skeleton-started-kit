# Standards

Use this section when you need the rules for writing code in this repository.

## Documents

- [Architecture](./architecture.md)
- [Conventions](./conventions.md)
- [Error Handling](./error-handling.md)
- [API Patterns](./api-patterns.md)

## Golden Rules

1. Do not access `process.env` directly in the application layer. Use config from `src/configs/index.ts`.
2. Prefer function-based exports over classes unless there is a strong reason otherwise.
3. Controllers focus on HTTP boundaries, services focus on business logic.
4. Repositories should choose the target connection explicitly when it matters.
5. Use `successResponse()` for success payloads and throw `AppError` subclasses for application errors.

[Back to Docs](../README.md)
