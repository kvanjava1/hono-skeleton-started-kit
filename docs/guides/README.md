# Guides

This directory contains workflow-oriented operational guides for the Hono Skeleton starter kit.

---

## 📚 Guide Index

- **[Make CLI (Code Generator)](./make-cli.md)**  
  Scaffold domains, controllers, services, repositories, validations, jobs, and mailables using `bun run make`.

- **[Mail System (Laravel-Style)](./mail.md)**  
  Mailable classes, responsive Hono JSX email templates, multi-driver transports (`log`, `smtp`, `resend`), and BullMQ background queue execution.

- **[Queues & Background Workers](./queues.md)**  
  BullMQ queue creators, background worker processes, retry backoff strategies, and Redis connection setup.

- **[Database Migrations](./migrations.md)**  
  Multi-engine database migration runner with explicit target connections (`sqlite`, `mysql`, `pg`, `mongo`).

- **[Database Seeders](./seeders.md)**  
  Target-aware seeder execution for populating test data and initial database state.

- **[Structured Logging](./logging.md)**  
  File-based JSONL logging, buffered write streams, daily rotation, and `requestId` tracing.

- **[Prometheus Metrics](./metrics.md)**  
  Prometheus metrics endpoint (`/metrics`), histogram latency monitoring, and token protection.

---

[Back to Documentation](../README.md)
