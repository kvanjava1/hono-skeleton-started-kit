export interface MailAddress {
  address: string;
  name?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: MailAddress;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface MailSendResult {
  success: boolean;
  messageId?: string;
  driver: string;
}

export interface MailDriver {
  send(options: SendMailOptions): Promise<MailSendResult>;
}
