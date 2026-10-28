import type { MailDriver } from "./mail.driver.ts";
import type { MailDriverType } from "../../../configs/mail.config.ts";
import { configMail } from "../../../configs/mail.config.ts";
import { LogDriver } from "./log.driver.ts";
import { SmtpDriver } from "./smtp.driver.ts";
import { ResendDriver } from "./resend.driver.ts";

export * from "./mail.driver.ts";
export * from "./log.driver.ts";
export * from "./smtp.driver.ts";
export * from "./resend.driver.ts";

const driversCache = new Map<string, MailDriver>();

export const getMailDriver = (driverType?: MailDriverType): MailDriver => {
  const selected = driverType ?? configMail.driver;

  const cached = driversCache.get(selected);
  if (cached) return cached;

  let driver: MailDriver;
  switch (selected) {
    case "smtp":
      driver = new SmtpDriver();
      break;
    case "resend":
      driver = new ResendDriver();
      break;
    case "log":
    default:
      driver = new LogDriver();
      break;
  }

  driversCache.set(selected, driver);
  return driver;
};

export const resetMailDrivers = (): void => {
  driversCache.clear();
};
