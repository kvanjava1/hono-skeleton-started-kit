import { describe, expect, test, beforeEach } from "bun:test";
import {
  LogDriver,
  SmtpDriver,
  ResendDriver,
  getMailDriver,
  resetMailDrivers,
} from "../../src/services/mail/drivers/index.ts";
import { resetConfigMail } from "../../src/configs/mail.config.ts";

describe("Mail Drivers", () => {
  beforeEach(() => {
    resetConfigMail();
    resetMailDrivers();
  });

  describe("LogDriver", () => {
    test("dispatches email successfully and returns messageId", async () => {
      const driver = new LogDriver();
      const result = await driver.send({
        to: "user@example.com",
        subject: "Hello World",
        html: "<p>Hello</p>",
      });

      expect(result.success).toBe(true);
      expect(result.driver).toBe("log");
      expect(result.messageId).toStartWith("log-");
    });
  });

  describe("SmtpDriver", () => {
    test("uses injected mock transporter correctly", async () => {
      const mockTransporter: any = {
        sendMail: async (mailOptions: any) => {
          return {
            messageId: "<mock-id@smtp>",
            accepted: [mailOptions.to],
          };
        },
      };

      const driver = new SmtpDriver(mockTransporter);
      const result = await driver.send({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test</p>",
      });

      expect(result.success).toBe(true);
      expect(result.driver).toBe("smtp");
      expect(result.messageId).toBe("<mock-id@smtp>");
    });
  });

  describe("ResendDriver", () => {
    test("throws error if API key is missing", async () => {
      const driver = new ResendDriver(undefined);
      expect(
        driver.send({
          to: "user@example.com",
          subject: "Test",
          html: "<p>Hi</p>",
        }),
      ).rejects.toThrow("RESEND_API_KEY");
    });
  });

  describe("getMailDriver factory", () => {
    test("returns LogDriver by default", () => {
      const driver = getMailDriver();
      expect(driver).toBeInstanceOf(LogDriver);
    });

    test("caches and reuses driver instance", () => {
      const driver1 = getMailDriver("log");
      const driver2 = getMailDriver("log");
      expect(driver1).toBe(driver2);
    });

    test("instantiates SmtpDriver when requested", () => {
      const driver = getMailDriver("smtp");
      expect(driver).toBeInstanceOf(SmtpDriver);
    });
  });
});
