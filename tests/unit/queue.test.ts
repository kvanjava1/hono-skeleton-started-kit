import { afterAll, describe, expect, mock, test } from "bun:test";

interface AddedJob {
  name: string;
  data: unknown;
}

const addedJobs: AddedJob[] = [];
const workerHandlers = new Map<string, (...args: unknown[]) => void>();

class FakeQueue {
  constructor(public name: string) {}

  async add(name: string, data: unknown) {
    addedJobs.push({ name, data });
    return { id: "job-1" };
  }

  async close() {}
}

class FakeWorker {
  constructor(public name: string) {}

  on(event: string, handler: (...args: unknown[]) => void) {
    workerHandlers.set(event, handler);
  }
}

mock.module("bullmq", () => ({ Queue: FakeQueue, Worker: FakeWorker }));

const { enqueueCrudCreate } = await import(
  "../../src/jobs/example/crudCreate.job.ts"
);
const { createWorker } = await import("../../src/queues/base.queue.ts");
const { requestContext } = await import("../../src/utils/context.util.ts");
const { logger } = await import("../../src/utils/logger.util.ts");
const { resetConfigApp } = await import("../../src/configs/index.ts");
const { renderMetrics, resetMetrics } = await import(
  "../../src/utils/metrics.util.ts"
);

afterAll(() => {
  mock.restore();
});

describe("enqueueCrudCreate", () => {
  test("forwards requestId from context into the job payload", async () => {
    const jobId = await requestContext.run({ requestId: "test-req-abc" }, () =>
      enqueueCrudCreate({ title: "Queue Test", content: "x" }),
    );

    expect(jobId).toBe("job-1");
    expect(addedJobs).toHaveLength(1);
    expect(addedJobs[0]!.data).toMatchObject({
      title: "Queue Test",
      content: "x",
      requestId: "test-req-abc",
    });
  });

  test("omits requestId when there is no request context", async () => {
    addedJobs.length = 0;
    await enqueueCrudCreate({ title: "No Context", content: "" });

    expect(
      (addedJobs[0]!.data as { requestId?: string }).requestId,
    ).toBeUndefined();
  });
});

describe("createWorker job logging", () => {
  const calls: Array<{ level: string; message: string; data?: unknown }> = [];
  const originalInfo = logger.info;
  const originalError = logger.error;

  logger.info = (message, data) => {
    calls.push({ level: "info", message, data });
  };
  logger.error = (message, data) => {
    calls.push({ level: "error", message, data });
  };

  afterAll(() => {
    logger.info = originalInfo;
    logger.error = originalError;
  });

  test("logs structured job completion", () => {
    createWorker("test-queue", async () => ({}));
    workerHandlers.get("completed")?.({ id: "42" });

    expect(calls).toContainEqual({
      level: "info",
      message: "[Queue] Job completed",
      data: { queue: "test-queue", jobId: "42" },
    });
  });

  test("logs structured job failure", () => {
    createWorker("test-queue", async () => ({}));
    workerHandlers.get("failed")?.({ id: "43" }, new Error("boom"));

    expect(calls).toContainEqual({
      level: "error",
      message: "[Queue] Job failed",
      data: { queue: "test-queue", jobId: "43", error: "boom" },
    });
  });
});

describe("createWorker queue metrics", () => {
  test("records completed and failed jobs when metrics are enabled", async () => {
    process.env.METRICS_ENABLED = "true";
    resetConfigApp();
    resetMetrics();

    createWorker("metrics-queue", async () => ({}));
    workerHandlers.get("completed")?.({
      id: "1",
      processedOn: 100,
      finishedOn: 350,
    });
    workerHandlers.get("failed")?.({ id: "2" }, new Error("boom"));

    const output = await renderMetrics();
    expect(output).toContain(
      'queue_jobs_total{queue="metrics-queue",status="completed"} 1',
    );
    expect(output).toContain(
      'queue_jobs_total{queue="metrics-queue",status="failed"} 1',
    );
    expect(output).toMatch(
      /queue_job_duration_ms_count\{queue="metrics-queue"\} 1/,
    );

    process.env.METRICS_ENABLED = "false";
    resetConfigApp();
  });
});
