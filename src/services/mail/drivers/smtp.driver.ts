import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { MailDriver, SendMailOptions, MailSendResult } from "./mail.driver.ts";
import { configMail } from "../../../configs/mail.config.ts";

export class SmtpDriver implements MailDriver {
  private transporter: Transporter;

  constructor(transporter?: Transporter) {
    if (transporter) {
      this.transporter = transporter;
      return;
    }

    const { smtp } = configMail;
    this.transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth,
    });
  }

  async send(options: SendMailOptions): Promise<MailSendResult> {
    const from = options.from ?? configMail.from;
    const fromFormatted = from.name ? `"${from.name}" <${from.address}>` : from.address;

    const info = await this.transporter.sendMail({
      from: fromFormatted,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: Array.isArray(options.cc) ? options.cc.join(", ") : options.cc,
      bcc: Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc,
      replyTo: options.replyTo,
    });

    return {
      success: true,
      messageId: info.messageId,
      driver: "smtp",
    };
  }
}
