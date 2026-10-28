# Mail System Guide (Laravel-Style)

This skeleton includes a comprehensive, production-ready mail system inspired by Laravel's Mailable and Queue architecture. It allows you to build type-safe HTML emails using **Hono JSX** and dispatch them synchronously or asynchronously via **BullMQ**.

---

## 🚀 Key Concepts

1. **Mailable Class:** An independent class in `src/mail/` representing an individual email, defining its subject, recipients, and JSX template.
2. **Hono JSX Templates:** HTML email templates located in `resources/views/emails/` leveraging type-safe TypeScript props and responsive table layouts.
3. **Fluent Dispatcher (`Mail::to`):** Clean and expressive syntax to queue or send emails.
4. **Multi-Driver Transport:** Easily switch between `log`, `smtp`, and `resend` via environment variables.

---

## ⚙️ Environment Configuration

Set the active driver and sender credentials in `.env`:

```env
# ====================
# Mail Configuration
# ====================
MAIL_DRIVER=log                  # Options: log | smtp | resend
MAIL_FROM_ADDRESS=noreply@example.com
MAIL_FROM_NAME="Hono Skeleton"

# SMTP Settings (when MAIL_DRIVER=smtp)
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=none             # none | tls | ssl

# Resend API (when MAIL_DRIVER=resend)
# RESEND_API_KEY=re_123456789
```

> [!TIP]
> During local development and testing, keep `MAIL_DRIVER=log`. Emails will be logged to `storages/logs/app/info.jsonl` with full headers and metadata without sending actual emails.

---

## 🛠️ Scaffolding a New Mailable

Use the Make CLI generator:

```bash
bun run make mail OrderShipped
```

This scaffolds two files:
1. `src/mail/OrderShipped.mail.ts`: The Mailable class.
2. `resources/views/emails/OrderShippedEmail.tsx`: The responsive Hono JSX template.

---

## ✉️ Dispatching Emails

### 1. Asynchronous (Background Queue — Recommended)
Offloads the rendering and delivery to the BullMQ background worker in $<5\text{ ms}$:

```typescript
import { Mail } from '../services/mail/mail.service.ts';
import { WelcomeMail } from '../mail/Welcome.mail.ts';

// In your controller or service:
await Mail.to('user@example.com').queue(
  new WelcomeMail({
    name: 'Budi Santoso',
    actionUrl: 'https://example.com/dashboard',
  })
);
```

### 2. Synchronous (Immediate Delivery)
Sends the email immediately in the current process (useful for CLI commands or scripts):

```typescript
await Mail.to('user@example.com').send(
  new WelcomeMail({ name: 'Budi Santoso' })
);
```

### 3. Advanced Options (Chaining)
You can chain additional parameters fluently:

```typescript
await Mail.to(['user1@example.com', 'user2@example.com'])
  .from('custom@domain.com', 'Custom Sender')
  .cc('manager@domain.com')
  .bcc('audit@domain.com')
  .replyTo('support@domain.com')
  .driver('smtp') // Override active driver for this specific mail
  .queue(new WelcomeMail({ name: 'Budi' }));
```

---

## 🎨 Writing Email Templates with Hono JSX

Email templates use the `<EmailLayout>` and `<EmailButton>` components from `resources/views/emails/layouts/EmailLayout.tsx`:

```tsx
// resources/views/emails/WelcomeEmail.tsx
import { EmailLayout, EmailButton } from './layouts/EmailLayout.tsx';

export interface WelcomeEmailProps {
  name: string;
  actionUrl?: string;
}

export const WelcomeEmail = ({ name, actionUrl }: WelcomeEmailProps) => {
  return (
    <EmailLayout title="Selamat Datang!">
      <h2>Halo, {name}!</h2>
      <p>Terima kasih telah bergabung dengan platform kami.</p>
      {actionUrl && (
        <EmailButton href={actionUrl} label="Aktivasi Akun" />
      )}
    </EmailLayout>
  );
};
```

---

## 🔄 Background Worker Execution

When `Mail.to().queue()` is called, the job is placed into the `send-email` BullMQ queue in Redis (`redis1`).

To process queued emails, start the background worker:

```bash
# Watch mode during development
bun run worker:code:dev

# Production
bun run worker:code:prod
```

Worker failures automatically retry up to 3 times using exponential backoff.
