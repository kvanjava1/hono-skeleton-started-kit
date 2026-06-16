import { describe, expect, test, beforeAll } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { getSqliteDb } from "../../src/database/sqlite.connection.ts";

setupTestEnvironment();

import { app } from "../../src/app.ts";

beforeAll(async () => {
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

describe("CRUD Example API", () => {
  const base = "http://localhost";

  test("POST /api/example/cruds creates a crud", async () => {
    const res = await app.fetch(
      new Request(`${base}/api/example/cruds`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "test", content: "hello" }),
      }),
    );
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.data.title).toBe("test");
    expect(body.data.content).toBe("hello");
    expect(body.data.id).toBeGreaterThan(0);
  });

  test("GET /api/example/cruds lists all cruds", async () => {
    const res = await app.fetch(new Request(`${base}/api/example/cruds`));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("success");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("GET /api/example/cruds/:id returns one crud", async () => {
    const created = await app.fetch(
      new Request(`${base}/api/example/cruds`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "get-test", content: "xyz" }),
      }),
    );
    const { data: crud } = await created.json();

    const res = await app.fetch(new Request(`${base}/api/example/cruds/${crud.id}`));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.title).toBe("get-test");
  });

  test("PUT /api/example/cruds/:id updates a crud", async () => {
    const created = await app.fetch(
      new Request(`${base}/api/example/cruds`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "before", content: "old" }),
      }),
    );
    const { data: crud } = await created.json();

    const res = await app.fetch(
      new Request(`${base}/api/example/cruds/${crud.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "after", content: "new" }),
      }),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.title).toBe("after");
    expect(body.data.content).toBe("new");
  });

  test("DELETE /api/example/cruds/:id deletes a crud", async () => {
    const created = await app.fetch(
      new Request(`${base}/api/example/cruds`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "delete-me" }),
      }),
    );
    const { data: crud } = await created.json();

    const del = await app.fetch(
      new Request(`${base}/api/example/cruds/${crud.id}`, { method: "DELETE" }),
    );
    expect(del.status).toBe(200);

    const get = await app.fetch(new Request(`${base}/api/example/cruds/${crud.id}`));
    expect(get.status).toBe(404);
  });

  test("GET /api/example/cruds/9999 returns 404", async () => {
    const res = await app.fetch(new Request(`${base}/api/example/cruds/9999`));
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.status).toBe("error");
    expect(body.message).toContain("Crud not found");
  });

  describe("OpenAPI docs", () => {
    test("GET /api/example/spec returns OpenAPI spec", async () => {
      const res = await app.fetch(new Request(`${base}/api/example/spec`));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.openapi).toBe("3.0.0");
      expect(body.info.title).toBe("CRUD Example API");
      expect(body.paths).toBeDefined();
      expect(body.paths["/api/example/cruds"]).toBeDefined();
      expect(body.paths["/api/example/cruds/{id}"]).toBeDefined();
    });

    test("GET /api/example/docs returns Scalar API reference HTML", async () => {
      const res = await app.fetch(new Request(`${base}/api/example/docs`));
      expect(res.status).toBe(200);

      const text = await res.text();
      expect(text).toContain("Scalar");
    });
  });
});
