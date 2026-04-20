# Queues

This skeleton uses **BullMQ** with Redis for asynchronous work outside the HTTP request lifecycle.

## When to Use a Queue

Use a queue when the process:

- does not need to finish in the same HTTP response
- is relatively heavy or time-consuming
- is safer to run in a separate worker
- needs retries or asynchronous execution

Examples:

- send email
- send webhook
- synchronize data to another system
- generate report or export file

## Requirements

- Redis must be enabled and reachable
- `DB_REDIS_ENABLED=true`
- Redis configuration must be valid
- default queue connection is `redis1`

## Generate Job File

```bash
bun run make job example/sendEmail
```

File path:

```text
src/jobs/example/sendEmail.job.ts
```

## Example Job

```ts
import type { Job } from 'bullmq';
import { createQueue } from '../queues/base.queue.ts';
import { logger } from '../utils/logger.util.ts';

export const sendEmailQueue = createQueue('send-email');

export interface SendEmailPayload {
  to: string;
  subject: string;
}

export const sendEmailProcessor = async (
  job: Job<SendEmailPayload>,
): Promise<{ success: true }> => {
  logger.info(`[SendEmailJob] Processing ${job.id}`);

  return { success: true };
};

export const dispatchSendEmail = async (data: SendEmailPayload) => {
  return await sendEmailQueue.add('send-email-task', data);
};
```

## Where to Enqueue Jobs

Queues should be called from services, not repositories.

Typical flow:

1. controller receives request
2. controller calls service
3. service performs main operation
4. service enqueues job if needed

## Register the Worker

Worker registration lives in:

```text
src/workers/index.ts
```

Example:

```ts
import { createWorker } from '../queues/base.queue.ts';
import { logger } from '../utils/logger.util.ts';
import { sendEmailProcessor } from '../jobs/example/sendEmail.job.ts';

const startWorkers = () => {
  logger.info('Background workers starting...');
  createWorker('send-email', sendEmailProcessor);
};
```

To choose Redis explicitly:

```ts
export const sendEmailQueue = createQueue('send-email', 'redis1');
createWorker('send-email', sendEmailProcessor, 'redis1');
```

## Run the Worker

Development:

```bash
bun run worker:dev
```

Production:

```bash
bun run worker:prod
```

## Job Rules

- job payloads should be simple and serializable
- never pass Hono `Context` into a queue
- keep main orchestration out of repositories
- if a worker needs more data, fetch it again through the proper layer
- always log job failures clearly

[Back to Docs](../README.md)
