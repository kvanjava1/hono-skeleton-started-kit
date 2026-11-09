import { describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

/**
 * Integration tests for the Inertia.js protocol integration, exercised
 * through the admin login page (the example CRUD demo was removed).
 *
 * The Inertia middleware is mounted globally on the web layer; API routes
 * must be unaffected (regression tests below).
 */

const readPageObject = (html: string) => {
  const match = html.match(
    /<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/,
  );
  expect(match).not.toBeNull();
  // serializePage escapes '/' as '\/' — JSON.parse decodes it natively.
  return JSON.parse(match![1]!);
};

describe("Inertia protocol (GET /admin/login)", () => {
  test("first visit returns the HTML shell with a valid embedded page object", async () => {
    const res = await app.fetch(new Request("http://localhost/admin/login"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain('id="app"');
    expect(html).toContain('rel="stylesheet"');

    const page = readPageObject(html);
    expect(page.component).toBe("dashboard-admin/Admin/Login");
    expect(page.props.appName).toBe("Hono Skeleton Multi-DB");
    expect(page.sharedProps).toContain("appName");
    expect(page.sharedProps).toContain("isDev");
  });

  test("HTML shell loads the owning client app bootstrap entry", async () => {
    const res = await app.fetch(new Request("http://localhost/admin/login"));
    const html = await res.text();
    // Per-app entry: resources/js/apps/dashboard-admin/app.ts
    expect(html).toContain("/js/apps/dashboard-admin/app.ts");
  });

  test("X-Inertia request returns the JSON page object with headers", async () => {
    const res = await app.fetch(
      new Request("http://localhost/admin/login", {
        headers: { "X-Inertia": "true", "X-Inertia-Version": "dev" },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-inertia")).toBe("true");
    expect(res.headers.get("content-type")).toContain("application/json");

    const page = await res.json();
    expect(page.component).toBe("dashboard-admin/Admin/Login");
    expect(page.version).toBe("dev");
    expect(String(page.url)).toContain("/admin/login");
  });

  test("stale X-Inertia-Version triggers 409 with X-Inertia-Location", async () => {
    const res = await app.fetch(
      new Request("http://localhost/admin/login", {
        headers: { "X-Inertia": "true", "X-Inertia-Version": "stale-hash" },
      }),
    );
    expect(res.status).toBe(409);
    expect(res.headers.get("x-inertia-location")).toContain("/admin/login");
  });
});

describe("Removed surfaces stay removed", () => {
  test("GET /example/jsx does not exist (404)", async () => {
    const res = await app.fetch(new Request("http://localhost/example/jsx"));
    expect(res.status).toBe(404);
  });

  test("the example CRUD web routes are gone (404)", async () => {
    const res = await app.fetch(new Request("http://localhost/cruds"));
    expect(res.status).toBe(404);
  });

  test("the example CRUD API routes are gone (404)", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/example/cruds"),
    );
    expect(res.status).toBe(404);
  });
});
