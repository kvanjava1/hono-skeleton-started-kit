import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import {
  redactSensitive,
  isLevelEnabled,
} from "../../src/utils/logger.util.ts";
import { resetConfigApp } from "../../src/configs/index.ts";

describe("redactSensitive", () => {
  test("redacts top-level sensitive keys", () => {
    const result = redactSensitive({
      password: "secret",
      title: "Hello",
    }) as Record<string, unknown>;

    expect(result.password).toBe("[REDACTED]");
    expect(result.title).toBe("Hello");
  });

  test("redacts nested objects and arrays", () => {
    const result = redactSensitive({
      user: { token: "abc", name: "Budi" },
      items: [{ authorization: "Bearer x" }],
    }) as {
      user: Record<string, unknown>;
      items: Record<string, unknown>[];
    };

    expect(result.user.token).toBe("[REDACTED]");
    expect(result.user.name).toBe("Budi");
    expect(result.items[0]!.authorization).toBe("[REDACTED]");
  });

  test("matches sensitive keys case-insensitively", () => {
    const result = redactSensitive({
      ApiKey: "x",
      CreditCard: "4111",
    }) as Record<string, unknown>;

    expect(result.ApiKey).toBe("[REDACTED]");
    expect(result.CreditCard).toBe("[REDACTED]");
  });

  test("leaves primitives untouched", () => {
    expect(redactSensitive("plain")).toBe("plain");
    expect(redactSensitive(42)).toBe(42);
    expect(redactSensitive(null)).toBe(null);
  });
});

describe("isLevelEnabled", () => {
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    resetConfigApp();
  });

  afterAll(() => {
    if (originalLogLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLogLevel;
    }
    resetConfigApp();
  });

  test("defaults to info when LOG_LEVEL is unset", () => {
    delete process.env.LOG_LEVEL;
    resetConfigApp();

    expect(isLevelEnabled("debug")).toBe(false);
    expect(isLevelEnabled("info")).toBe(true);
    expect(isLevelEnabled("error")).toBe(true);
  });

  test("respects LOG_LEVEL=warn", () => {
    process.env.LOG_LEVEL = "warn";
    resetConfigApp();

    expect(isLevelEnabled("info")).toBe(false);
    expect(isLevelEnabled("warn")).toBe(true);
    expect(isLevelEnabled("error")).toBe(true);
  });

  test("falls back to info on invalid LOG_LEVEL", () => {
    process.env.LOG_LEVEL = "garbage";
    resetConfigApp();

    expect(isLevelEnabled("debug")).toBe(false);
    expect(isLevelEnabled("info")).toBe(true);
  });
});
