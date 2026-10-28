import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  configMail,
  resetConfigMail,
  buildConfigMail,
} from "../../src/configs/mail.config.ts";

describe("Mail Configuration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetConfigMail();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetConfigMail();
  });

  test("defaults to log driver and default sender", () => {
    delete process.env.MAIL_DRIVER;
    delete process.env.MAIL_FROM_ADDRESS;
    delete process.env.MAIL_FROM_NAME;

    expect(configMail.driver).toBe("log");
    expect(configMail.from.address).toBe("noreply@example.com");
    expect(configMail.from.name).toBe("Hono Skeleton");
    expect(configMail.smtp.host).toBe("127.0.0.1");
    expect(configMail.smtp.port).toBe(1025);
    expect(configMail.smtp.secure).toBe(false);
    expect(configMail.smtp.auth).toBeUndefined();
  });

  test("parses custom smtp settings with authentication", () => {
    const config = buildConfigMail({
      MAIL_DRIVER: "smtp",
      MAIL_HOST: "smtp.mailtrap.io",
      MAIL_PORT: "2525",
      MAIL_USERNAME: "my-user",
      MAIL_PASSWORD: "my-password",
      MAIL_ENCRYPTION: "tls",
      MAIL_FROM_ADDRESS: "admin@myapp.com",
      MAIL_FROM_NAME: "My App",
    });

    expect(config.driver).toBe("smtp");
    expect(config.smtp.host).toBe("smtp.mailtrap.io");
    expect(config.smtp.port).toBe(2525);
    expect(config.smtp.auth).toEqual({ user: "my-user", pass: "my-password" });
    expect(config.from.address).toBe("admin@myapp.com");
    expect(config.from.name).toBe("My App");
  });

  test("enables secure for port 465 or ssl encryption", () => {
    const config1 = buildConfigMail({
      MAIL_PORT: "465",
    });
    expect(config1.smtp.secure).toBe(true);

    const config2 = buildConfigMail({
      MAIL_ENCRYPTION: "ssl",
    });
    expect(config2.smtp.secure).toBe(true);
  });

  test("parses resend api key", () => {
    const config = buildConfigMail({
      MAIL_DRIVER: "resend",
      RESEND_API_KEY: "re_123456",
    });

    expect(config.driver).toBe("resend");
    expect(config.resend.apiKey).toBe("re_123456");
  });

  test("falls back to log driver on unknown driver name", () => {
    const config = buildConfigMail({
      MAIL_DRIVER: "invalid-driver",
    });
    expect(config.driver).toBe("log");
  });
});
