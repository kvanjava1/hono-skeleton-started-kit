import { describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

describe("Web Landing Page", () => {
  test("GET / returns 200 HTML with app name", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const text = await res.text();
    expect(text).toContain("Hono Multi-DB");
  });

  test("GET /example returns 200 HTML", async () => {
    const res = await app.fetch(new Request("http://localhost/example"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });
});

describe("Security & Common Middlewares", () => {
  test("response includes security headers", async () => {
    const res = await app.fetch(new Request("http://localhost/api/health"));
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
  });

  test("response includes rate limit headers", async () => {
    const res = await app.fetch(new Request("http://localhost/api/health"));
    expect(res.headers.get("x-ratelimit-limit")).toBe("100");
    expect(res.headers.get("x-ratelimit-remaining")).toBeDefined();
  });
});
