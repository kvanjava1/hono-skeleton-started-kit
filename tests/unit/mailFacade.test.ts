import { describe, expect, test, mock, afterAll, beforeEach } from "bun:test";

interface AddedJob {
  name: string;
  data: any;
  opts?: any;
}

const addedJobs: AddedJob[] = [];

class FakeQueue {
  constructor(public name: string) {}

  async add(name: string, data: unknown, opts?: unknown) {
    addedJobs.push({ name, data, opts });
    return { id: "mock-job-123" };
  }

  async close() {}
}

mock.module("bullmq", () => ({
  Queue: FakeQueue,
  Worker: class FakeWorker {
    on() {}
  },
}));

const { Mail } = await import("../../src/services/mail/mail.service.ts");
const { WelcomeMail } = await import("../../src/mail/Welcome.mail.ts");
const { resetConfigMail } = await import("../../src/configs/mail.config.ts");
const { resetMailDrivers } = await import(
  "../../src/libraries/mail/index.ts"
);
const { requestContext } = await import("../../src/utils/context.util.ts");

afterAll(() => {
  mock.restore();
});

describe("Mail Facade & PendingMail", () => {
  beforeEach(() => {
    resetConfigMail();
    resetMailDrivers();
    addedJobs.length = 0;
  });

  test("Mail.to().send() sends email synchronously via active driver", async () => {
    const mailable = new WelcomeMail({ name: "Alex" });
    const result = await Mail.to("alex@example.com")
      .from("support@myapp.com", "Support")
      .send(mailable);

    expect(result.success).toBe(true);
    expect(result.driver).toBe("log");
    expect(result.messageId).toStartWith("log-");
  });

  test("Mail.to().queue() enqueues job into BullMQ with rendered HTML and options", async () => {
    const mailable = new WelcomeMail({
      name: "Maria",
      actionUrl: "https://myapp.com/verify",
    });

    const result = await requestContext.run(
      { requestId: "req-mail-123" },
      async () => {
        return await Mail.to("maria@example.com")
          .cc(["cc1@example.com"])
          .replyTo("reply@example.com")
          .queue(mailable);
      },
    );

    expect(result.jobId).toBe("mock-job-123");
    expect(addedJobs.length).toBe(1);

    const job = addedJobs[0]!;
    expect(job.name).toBe("send");
    expect(job.data.to).toBe("maria@example.com");
    expect(job.data.subject).toBe("Selamat Datang, Maria!");
    expect(job.data.html).toContain("Maria");
    expect(job.data.html).toContain("https://myapp.com/verify");
    expect(job.data.cc).toEqual(["cc1@example.com"]);
    expect(job.data.replyTo).toBe("reply@example.com");
    expect(job.data.requestId).toBe("req-mail-123");
  });
});
