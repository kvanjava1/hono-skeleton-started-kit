# Queues & Background Workers

This skeleton uses **BullMQ** with Redis to handle asynchronous and background processing outside the HTTP request lifecycle.

---

## 🎯 When to Use a Queue

Use background queues when a task:
- Does not need to complete within the same HTTP response (fire-and-forget or eventual consistency).
- Involves heavy or slow I/O (external APIs, webhooks, third-party services).
- Requires automated retry mechanisms on transient network failures.
- Needs isolation within worker processes to prevent blocking the HTTP server event loop.

Common use cases:
- Sending emails, SMS, or push notifications.
- Dispatching outgoing webhooks.
- Multi-database data synchronization.
- Generating large PDF or Excel reports.

---

## ⚙️ Requirements

- Redis must be enabled and accessible (`DB_REDIS_ENABLED=true` in `.env`).
- Default Redis connection target is `redis1` (`REDIS_HOST_1`, `REDIS_PORT_1`).

---

## 🛠️ Scaffolding a Job

Use the Make CLI generator:

```bash
bun run make job SendEmail
```

This creates `src/jobs/SendEmail.job.ts`.

### Example Job Implementation:

```ts
import type { Job } from 'bullmq';
import { createQueue } from '../queues/base.queue.ts';
import { logger } from '../utils/logger.util.ts';

export const SEND_EMAIL_QUEUE = 'send-email';
export const sendEmailQueue = createQueue(SEND_EMAIL_QUEUE, 'redis1');

export interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  requestId?: string; // For distributed tracing
}

export const processSendEmail = async (job: Job<SendEmailPayload>): Promise<{ success: boolean }> => {
  logger.info(`[SendEmailJob] Processing job ${job.id} for ${job.data.to}`);
  
  // Email sending logic here...
  
  return { success: true };
};
```

---

## 🔗 Enqueuing Jobs from Services

Jobs should be enqueued from the **Service Layer**, rather than directly from Controllers or Repositories:

```ts
import { sendEmailQueue } from '../../jobs/SendEmail.job.ts';
import { getRequestId } from '../../utils/context.util.ts';

export const triggerWelcomeEmail = async (userEmail: string) => {
  await sendEmailQueue.add('send-welcome-email', {
    to: userEmail,
    subject: 'Welcome!',
    body: 'Thank you for signing up.',
    requestId: getRequestId(), // Propagate request ID for log correlation
  });
};
```

---

## 👷 Registering Workers in `src/workers/index.ts`

Workers register listeners to process queues in the background:

```ts
import { createWorker } from '../queues/base.queue.ts';
import { processSendEmail, SEND_EMAIL_QUEUE, type SendEmailPayload } from '../jobs/SendEmail.job.ts';
import { requestContext } from '../utils/context.util.ts';

// Register inside startWorkers()
createWorker(SEND_EMAIL_QUEUE, async (job) => {
  const data = job.data as SendEmailPayload;
  
  // Wrap execution inside requestContext so requestId is tracked in JSONL logs
  await requestContext.run(
    { requestId: data.requestId ?? `job-${job.id}` },
    async () => {
      await processSendEmail(job);
    }
  );
});
```

---

## 🏃 Running the Worker

### Development Mode (with hot-reloading):
```bash
bun run worker:code:dev
```

### Production Mode:
```bash
# Using Bun runtime
bun run worker:code:prod

# Or using the compiled binary
NODE_ENV=production SERVICE_NAME=queue ./server --worker
```

---

## ⚠️ Important Rules

1. **Serializable Payloads**: Only pass serializable primitives or plain JSON objects in queue payloads. Never pass class instances, database connections, or Hono `Context`.
2. **Idempotence**: Ensure job processors are idempotent and safe to retry upon unexpected worker restarts or network drops.
3. **Log Tracing**: Forward `requestId` from the HTTP request context into the job payload to enable end-to-end tracing across log files.

---

[Back to Guides](../README.md)
