import type { Mailable, MailEnvelope } from "./mailable.ts";
import { WelcomeEmail } from "../../resources/views/emails/WelcomeEmail.tsx";

export interface WelcomeMailProps {
  name: string;
  actionUrl?: string;
}

export class WelcomeMail implements Mailable {
  constructor(public props: WelcomeMailProps) {}

  envelope(): MailEnvelope {
    return {
      subject: `Selamat Datang, ${this.props.name}!`,
    };
  }

  content(): string {
    return WelcomeEmail(this.props).toString();
  }
}
