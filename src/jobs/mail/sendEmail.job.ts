import type { Job } from "bullmq";
import { createQueue } from "../../queues/base.queue.ts";
import { getMailDriver } from "../../services/mail/drivers/index.ts";
import type { MailAddress } from "../../mail/mailable.ts";
import type { MailDriverType } from "../../configs/mail.config.ts";
import { getContext } from "../../utils/context.util.ts";
import { logger } from "../../utils/logger.util.ts";

export const SEND_EMAIL_QUEUE = "send-email";

export interface SendEmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: MailAddress;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  driver?: MailDriverType;
  requestId?: string;
}

export const enqueueSendEmail = async (data: SendEmailJobData) => {
  const queue = createQueue(SEND_EMAIL_QUEUE);
  const requestId = data.requestId ?? getContext()?.requestId;
  const payload = { ...data, ...(requestId ? { requestId } : {}) };

  const job = await queue.add("send", payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });

  return String(job.id);
};

export const processSendEmail = async (job: { data: SendEmailJobData }) => {
  const { driver: driverType, ...options } = job.data;
  const driver = getMailDriver(driverType);

  logger.info("[MailJob] Processing email job", {
    to: options.to,
    subject: options.subject,
    driver: driverType || "default",
  });

  const result = await driver.send(options);
  return result;
};
