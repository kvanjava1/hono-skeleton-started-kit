import type { MailDriver, SendMailOptions, MailSendResult } from "./mail.driver.ts";
import { configMail } from "../../../configs/mail.config.ts";

export class ResendDriver implements MailDriver {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? configMail.resend.apiKey;
  }

  async send(options: SendMailOptions): Promise<MailSendResult> {
    if (!this.apiKey) {
      throw new Error(
        "[ResendDriver] RESEND_API_KEY is not defined in environment variables",
      );
    }

    const from = options.from ?? configMail.from;
    const fromFormatted = from.name ? `${from.name} <${from.address}>` : from.address;

    const payload = {
      from: fromFormatted,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      reply_to: options.replyTo,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`[ResendDriver] Failed to send email: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as { id?: string };

    return {
      success: true,
      messageId: data.id,
      driver: "resend",
    };
  }
}
