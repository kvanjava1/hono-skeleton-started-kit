import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

beforeAll(async () => {
  // Same in-memory schema setup as tests/integration/crud.test.ts.
  const db = await getSqliteDb("sqlite1");
  db.run(`
    CREATE TABLE IF NOT EXISTS cruds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT DEFAULT NULL
    );
  `);
});

/**
 * Integration tests for the Inertia.js protocol integration
 * (plans/inertia-vue-integration/phase-1).
 *
 * The Inertia middleware is mounted globally on the web layer; API routes
 * must be unaffected (regression tests below).
 */

describe("Inertia protocol (GET /)", () => {
  test("first visit returns the HTML shell with a valid embedded page object", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");

    const html = await res.text();
    expect(html).toContain('id="app"');
    expect(html).toContain('rel="stylesheet"');

    const match = html.match(
      /<script data-page="app" type="application\/json">([\s\S]*?)<\/script>/,
    );
    expect(match).not.toBeNull();

    // serializePage escapes '/' as '\/' — JSON.parse decodes it natively.
    const page = JSON.parse(match![1]!);
    expect(page.component).toBe("example1/Cruds/Index");
    expect(page.props.appName).toBe("Hono Skeleton Multi-DB");
    expect(Array.isArray(page.props.cruds)).toBe(true);
    expect(page.sharedProps).toContain("appName");
    expect(page.sharedProps).toContain("isDev");
  });

  test("HTML shell loads the owning client app bootstrap entry", async () => {
    const res = await app.fetch(new Request("http://localhost/"));
    const html = await res.text();
    // Per-app entry: resources/js/apps/example1/app.ts
    expect(html).toContain("/js/apps/example1/app.ts");
  });

  test("X-Inertia request returns the JSON page object with headers", async () => {
    const res = await app.fetch(
      new Request("http://localhost/", {
        headers: { "X-Inertia": "true", "X-Inertia-Version": "dev" },
      }),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("x-inertia")).toBe("true");
    expect(res.headers.get("content-type")).toContain("application/json");

    const page = await res.json();
    expect(page.component).toBe("example1/Cruds/Index");
    expect(page.version).toBe("dev");
    expect(String(page.url)).toContain("/");
  });

  test("stale X-Inertia-Version triggers 409 with X-Inertia-Location", async () => {
    const res = await app.fetch(
      new Request("http://localhost/", {
        headers: { "X-Inertia": "true", "X-Inertia-Version": "stale-hash" },
      }),
    );
    expect(res.status).toBe(409);
    expect(res.headers.get("x-inertia-location")).toContain("/");
  });
});

describe("JSX example removal (pure SSR pages are gone by design)", () => {
  test("GET /example/jsx no longer exists (404)", async () => {
    const res = await app.fetch(new Request("http://localhost/example/jsx"));
    expect(res.status).toBe(404);
  });
});

describe("Inertia CRUD demo (web layer reuses CrudService)", () => {
  const inertiaRequest = async (
    path: string,
    method: string,
    payload?: unknown,
    headers: Record<string, string> = {},
  ): Promise<Response> =>
    await app.fetch(
      new Request(`http://localhost${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Inertia": "true",
          "X-Inertia-Version": "dev",
          Origin: "http://localhost",
          ...headers,
        },
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      }),
    );

  const readPageProps = async (path: string) => {
    const res = await app.fetch(
      new Request(`http://localhost${path}`, {
        headers: { "X-Inertia": "true", "X-Inertia-Version": "dev" },
      }),
    );
    expect(res.status).toBe(200);
    const page = await res.json();
    return page.props;
  };

  test("POST /cruds creates an item through the shared CrudService", async () => {
    const res = await inertiaRequest("/cruds", "POST", {
      title: "From Inertia",
      content: "created via the web layer",
    });
    // POST redirect stays 302 (only PUT/PATCH/DELETE are rewritten to 303).
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/");
  });

  test("GET / lists the created item in the page props", async () => {
    const props = await readPageProps("/");
    const created = props.cruds.find((c: { title: string }) => c.title === "From Inertia");
    expect(created).toBeDefined();
    expect(created.content).toBe("created via the web layer");
  });

  test("PUT /cruds/:id updates and is rewritten to 303 for Inertia", async () => {
    const props = await readPageProps("/");
    const created = props.cruds.find((c: { title: string }) => c.title === "From Inertia");
    expect(created).toBeDefined();

    const res = await inertiaRequest(`/cruds/${created.id}`, "PUT", {
      title: "From Inertia (updated)",
    });
    expect(res.status).toBe(303); // protocol rewrite: 302 -> 303 for non-GET
    expect(res.headers.get("location")).toBe("/");

    const after = await readPageProps("/");
    expect(
      after.cruds.find((c: { id: number }) => c.id === created.id).title,
    ).toBe("From Inertia (updated)");
  });

  test("DELETE /cruds/:id removes the item (303 redirect, soft delete)", async () => {
    const props = await readPageProps("/");
    const created = props.cruds.find((c: { title: string }) => c.title === "From Inertia (updated)");
    expect(created).toBeDefined();

    const res = await inertiaRequest(`/cruds/${created.id}`, "DELETE");
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");

    const after = await readPageProps("/");
    expect(
      after.cruds.find((c: { id: number }) => c.id === created.id),
    ).toBeUndefined();
  });

  test("invalid create returns a 422 Inertia page response with props.errors", async () => {
    const res = await inertiaRequest("/cruds", "POST", { title: "" });
    expect(res.status).toBe(422);
    // @inertiajs/core 3.x rejects any response without this header as
    // "plain JSON" and shows its error modal instead of filling the bag.
    expect(res.headers.get("x-inertia")).toBe("true");

    const page = await res.json();
    expect(page.component).toBe("example1/Cruds/Index");
    expect(page.url).toBe("/");
    expect(page.version).toBe("dev");
    // Props are replaced wholesale by the client, so they must be complete.
    expect(page.props.appName).toBe("Hono Skeleton Multi-DB");
    expect(Array.isArray(page.props.cruds)).toBe(true);
    expect(page.props.errors.title).toBeString();
  });

  test("cross-origin mutation is rejected with 403", async () => {
    const res = await inertiaRequest(
      "/cruds",
      "POST",
      { title: "Evil" },
      { Origin: "https://evil.example" },
    );
    expect(res.status).toBe(403);
  });

  test("non-Inertia requests keep the standard application error contract", async () => {
    const res = await app.fetch(
      new Request("http://localhost/cruds", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost" },
        body: JSON.stringify({ title: "" }),
      }),
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.message).toBe("Validation failed");
  });

  test("edit page renders with the crud props", async () => {
    const createRes = await inertiaRequest("/cruds", "POST", {
      title: "Edit page item",
    });
    expect(createRes.status).toBe(302);

    const props = await readPageProps("/");
    const created = props.cruds.find((c: { title: string }) => c.title === "Edit page item");
    expect(created).toBeDefined();

    const res = await app.fetch(
      new Request(`http://localhost/cruds/${created.id}/edit`, {
        headers: { "X-Inertia": "true", "X-Inertia-Version": "dev" },
      }),
    );
    expect(res.status).toBe(200);

    const page = await res.json();
    expect(page.component).toBe("example1/Cruds/Edit");
    expect(page.props.crud.title).toBe("Edit page item");
  });
});
