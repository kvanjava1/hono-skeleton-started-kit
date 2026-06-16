import { describe, expect, test } from "bun:test";
import { getEnv, getEnvBool, getEnvNumber } from "../../src/configs/env.ts";

function withEnv(key: string, value: string | undefined, fn: () => void) {
  const original = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  try {
    fn();
  } finally {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
}

function withoutEnv(key: string, fn: () => void) {
  withEnv(key, undefined, fn);
}

describe("getEnv", () => {
  test("returns env value when set", () => {
    withEnv("TEST_KEY", "hello", () => {
      expect(getEnv("TEST_KEY")).toBe("hello");
    });
  });

  test("returns default when env not set", () => {
    withoutEnv("TEST_KEY", () => {
      expect(getEnv("TEST_KEY", "default")).toBe("default");
    });
  });

  test("throws when env not set and no default", () => {
    withoutEnv("REQUIRED_KEY", () => {
      expect(() => getEnv("REQUIRED_KEY")).toThrow(
        "Environment variable REQUIRED_KEY is required",
      );
    });
  });
});

describe("getEnvNumber", () => {
  test("returns number when env set", () => {
    withEnv("TEST_NUM", "42", () => {
      expect(getEnvNumber("TEST_NUM")).toBe(42);
    });
  });

  test("returns default when not set", () => {
    withoutEnv("TEST_NUM", () => {
      expect(getEnvNumber("TEST_NUM", 99)).toBe(99);
    });
  });

  test("throws when not set and no default", () => {
    withoutEnv("REQUIRED_NUM", () => {
      expect(() => getEnvNumber("REQUIRED_NUM")).toThrow(
        "Environment variable REQUIRED_NUM is required",
      );
    });
  });

  test("throws on NaN", () => {
    withEnv("TEST_NUM", "not-a-number", () => {
      expect(() => getEnvNumber("TEST_NUM")).toThrow(
        "Environment variable TEST_NUM must be a number",
      );
    });
  });

  test("strips whitespace", () => {
    withEnv("TEST_NUM", " 100 ", () => {
      expect(getEnvNumber("TEST_NUM")).toBe(100);
    });
  });
});

describe("getEnvBool", () => {
  test('"true" returns true', () => {
    withEnv("TEST_BOOL", "true", () => {
      expect(getEnvBool("TEST_BOOL", false)).toBe(true);
    });
  });

  test('"1" returns true', () => {
    withEnv("TEST_BOOL", "1", () => {
      expect(getEnvBool("TEST_BOOL", false)).toBe(true);
    });
  });

  test('"yes" returns true', () => {
    withEnv("TEST_BOOL", "yes", () => {
      expect(getEnvBool("TEST_BOOL", false)).toBe(true);
    });
  });

  test('"false" returns false', () => {
    withEnv("TEST_BOOL", "false", () => {
      expect(getEnvBool("TEST_BOOL", true)).toBe(false);
    });
  });

  test("returns default when not set", () => {
    withoutEnv("TEST_BOOL", () => {
      expect(getEnvBool("TEST_BOOL", true)).toBe(true);
    });
  });
});
