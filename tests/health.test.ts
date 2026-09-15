import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "./helpers/setup.ts";

setupTestEnvironment();

import { app } from "../src/app.ts";
import { resetConfigSqlite } from "../src/configs/index.ts";
import { closeSqliteConnection } from "../src/database/sqlite.connection.ts";

interface ReadinessCheckBody {
  name: string;
  status: string;
  latencyMs: number;
  error?: string;
}

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

describe("GET /api/health/ready", () => {
  test("returns 200 with dependency checks when all are up", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/health/ready"),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("success");
    expect(body.message).toBe("Ready");
    expect(Array.isArray(body.data.checks)).toBe(true);

    const sqliteCheck = (body.data.checks as ReadinessCheckBody[]).find(
      (check) => check.name === "sqlite1",
    );
    expect(sqliteCheck?.status).toBe("up");
  });

  describe("when a dependency is down", () => {
    beforeAll(() => {
      process.env.SQLITE_DB_PATH_1 = "/dev/null/nonexistent/db.sqlite";
      resetConfigSqlite();
      closeSqliteConnection("sqlite1");
    });

    afterAll(() => {
      process.env.SQLITE_DB_PATH_1 = ":memory:";
      resetConfigSqlite();
      closeSqliteConnection("sqlite1");
    });

    test("returns 503 with the failing check", async () => {
      const res = await app.fetch(
        new Request("http://localhost/api/health/ready"),
      );
      expect(res.status).toBe(503);

      const body = await res.json();
      expect(body.status).toBe("error");
      expect(body.message).toBe("Not ready");

      const sqliteCheck = (body.data.checks as ReadinessCheckBody[]).find(
        (check) => check.name === "sqlite1",
      );
      expect(sqliteCheck?.status).toBe("down");
      expect(sqliteCheck?.error).toBeString();
    });
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
