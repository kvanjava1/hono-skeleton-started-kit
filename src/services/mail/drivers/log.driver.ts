import type { MailDriver, SendMailOptions, MailSendResult } from "./mail.driver.ts";
import { configMail } from "../../../configs/mail.config.ts";
import { logger } from "../../../utils/logger.util.ts";

export class LogDriver implements MailDriver {
  async send(options: SendMailOptions): Promise<MailSendResult> {
    const messageId = `log-${crypto.randomUUID()}`;
    const from = options.from ?? configMail.from;

    logger.info("[Mail] Email dispatched via log driver", {
      messageId,
      to: options.to,
      from: from.name ? `"${from.name}" <${from.address}>` : from.address,
      subject: options.subject,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      contentLength: options.html.length,
    });

    return {
      success: true,
      messageId,
      driver: "log",
    };
  }
}
