import type { Mailable, MailAddress } from "../../mail/mailable.ts";
import type { MailDriverType } from "../../configs/mail.config.ts";
import { getMailDriver, type MailSendResult } from "../../libraries/mail/index.ts";
import { enqueueSendEmail } from "../../jobs/mail/sendEmail.job.ts";

export class PendingMail {
  private _recipients: string | string[];
  private _from?: MailAddress;
  private _cc?: string | string[];
  private _bcc?: string | string[];
  private _replyTo?: string;
  private _driver?: MailDriverType;

  constructor(recipients: string | string[]) {
    this._recipients = recipients;
  }

  from(address: string, name?: string): this {
    this._from = { address, name };
    return this;
  }

  cc(recipients: string | string[]): this {
    this._cc = recipients;
    return this;
  }

  bcc(recipients: string | string[]): this {
    this._bcc = recipients;
    return this;
  }

  replyTo(address: string): this {
    this._replyTo = address;
    return this;
  }

  driver(driverType: MailDriverType): this {
    this._driver = driverType;
    return this;
  }

  private async prepareOptions(mailable: Mailable) {
    const envelope = await mailable.envelope();
    const html = await mailable.content();

    return {
      to: this._recipients,
      subject: envelope.subject,
      html,
      from: this._from ?? envelope.from,
      cc: this._cc ?? envelope.cc,
      bcc: this._bcc ?? envelope.bcc,
      replyTo: this._replyTo ?? envelope.replyTo,
      driver: this._driver,
    };
  }

  /**
   * Send the email immediately (synchronously).
   */
  async send(mailable: Mailable): Promise<MailSendResult> {
    const options = await this.prepareOptions(mailable);
    const driver = getMailDriver(options.driver);
    return await driver.send(options);
  }

  /**
   * Push the email into BullMQ background queue (asynchronously).
   */
  async queue(mailable: Mailable): Promise<{ jobId: string }> {
    const options = await this.prepareOptions(mailable);
    const jobId = await enqueueSendEmail(options);
    return { jobId };
  }
}

export class Mail {
  /**
   * Set the recipient(s) and return a fluent PendingMail builder.
   */
  static to(recipient: string | string[]): PendingMail {
    return new PendingMail(recipient);
  }
}
