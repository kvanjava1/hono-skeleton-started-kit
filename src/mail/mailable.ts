export interface MailAddress {
  address: string;
  name?: string;
}

export interface MailEnvelope {
  subject: string;
  from?: MailAddress;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface Mailable {
  envelope(): Promise<MailEnvelope> | MailEnvelope;
  content(): Promise<string> | string;
}
