import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";

setupTestEnvironment({ RATE_LIMIT_MAX: "5" });

import { app } from "../../src/app.ts";

describe("Rate Limiter", () => {
  test("allows requests under limit", async () => {
    for (let i = 0; i < 3; i++) {
      const res = await app.fetch(
        new Request("http://localhost/api/health", {
          headers: { "x-forwarded-for": "10.0.0.1" },
        }),
      );
      expect(res.status).toBe(200);
    }
  });

  test("blocks requests exceeding limit", async () => {
    const ip = "10.0.0.2";
    for (let i = 0; i < 5; i++) {
      await app.fetch(
        new Request("http://localhost/api/health", {
          headers: { "x-forwarded-for": ip },
        }),
      );
    }

    const res = await app.fetch(
      new Request("http://localhost/api/health", {
        headers: { "x-forwarded-for": ip },
      }),
    );
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.message).toContain("Too many requests");
  });

  test("different IPs are not blocked together", async () => {
    for (let i = 0; i < 5; i++) {
      await app.fetch(
        new Request("http://localhost/api/health", {
          headers: { "x-forwarded-for": "10.0.0.3" },
        }),
      );
    }

    const res = await app.fetch(
      new Request("http://localhost/api/health", {
        headers: { "x-forwarded-for": "10.0.0.4" },
      }),
    );
    expect(res.status).toBe(200);
  });
});
