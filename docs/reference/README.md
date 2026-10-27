# Technical Reference

This section provides stable technical facts and deep-dives into the skeleton's internal architecture, folder layout, and multi-database connection model.

---

## 📚 Documents

1. **[Architecture Overview](./architecture-overview.md)**
   - Complete system overview, runtime stack, execution modes (HTTP Server vs Worker).
   - Full directory tree of the current project.
   - Comprehensive list of default endpoints (Web SSR, System & Observability, API Docs, and Sample CRUD).
   
2. **[Connection Model](./connection-model.md)**
   - Named connection model for SQLite, MySQL, PostgreSQL, MongoDB, and Redis.
   - Built-in backward compatibility fallbacks.
   - Target-aware database migrations.

---

[Back to Documentation](../README.md)
