import { describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "./helpers/setup.ts";

setupTestEnvironment();

import { app } from "../src/app.ts";

describe("GET /api/health", () => {
  test("returns 200 with uptime and timestamp", async () => {
    const res = await app.fetch(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toBe("OK");
    expect(body.data.uptime).toBeGreaterThan(0);
    expect(body.data.timestamp).toBeString();
  });
});

describe("404 handler", () => {
  test("API unknown route returns 404 JSON", async () => {
    const res = await app.fetch(new Request("http://localhost/api/nonexistent"));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.message).toContain("not found");
  });

  test("Web unknown route returns 404 JSON", async () => {
    const res = await app.fetch(new Request("http://localhost/nonexistent"));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.message).toContain("not found");
  });
});
