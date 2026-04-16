import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { closeAllSqliteConnections, getSqliteDb } from "../src/database/index.ts";
import {
  createExample as createExampleRecord,
  findExampleById,
} from "../src/repositories/sqlite/example.repository.ts";
import * as baseExamplesMigration from "../scripts/migrations/sqlite/files/20260410080127_create_examples.ts";
import * as examplesCrudMigration from "../scripts/migrations/sqlite/files/20260415170000_prepare_examples_crud.ts";

const queuedPayloads: Array<{
  full_name: string;
  email: string;
  passwordHash: string;
}> = [];
const cacheStore = new Map<string, unknown>();
const cacheOps = {
  get: [] as string[],
  set: [] as Array<{ key: string; ttlSeconds: number }>,
  deleteByPattern: [] as string[],
};

mock.module("../src/jobs/CreateExample.job.ts", () => ({
  dispatchCreateExample: async (payload: {
    full_name: string;
    email: string;
    passwordHash: string;
  }) => {
    queuedPayloads.push(payload);
    return { id: "job-create-example-1" };
  },
  createExampleFromJob: async () => {
    throw new Error("createExampleFromJob should not be called in HTTP CRUD tests");
  },
  createExampleProcessor: async () => ({ exampleId: 1 }),
}));

mock.module("../src/utils/cache.util.ts", () => ({
  cacheGet: async <T>(key: string): Promise<T | null> => {
    cacheOps.get.push(key);
    return (cacheStore.get(key) as T | undefined) ?? null;
  },
  cacheSet: async (key: string, value: unknown, ttlSeconds = 3600) => {
    cacheOps.set.push({ key, ttlSeconds });
    cacheStore.set(key, value);
  },
  cacheDeleteByPattern: async (pattern: string) => {
    cacheOps.deleteByPattern.push(pattern);
    const prefix = pattern.replace(/\*$/, "");

    for (const key of [...cacheStore.keys()]) {
      if (key.startsWith(prefix)) {
        cacheStore.delete(key);
      }
    }
  },
  cacheDelete: async (key: string) => {
    cacheStore.delete(key);
  },
  cacheMGet: async <T>(keys: string[]): Promise<(T | null)[]> => {
    return keys.map((key) => (cacheStore.get(key) as T | undefined) ?? null);
  },
  cacheMSet: async (
    items: { key: string; value: unknown; ttlSeconds?: number }[],
  ) => {
    for (const item of items) {
      cacheStore.set(item.key, item.value);
    }
  },
}));

const { app } = await import("../src/app.ts");
const { createExampleFromJob } = await import("../src/services/sqlite/example.service.ts");

const configureTestEnv = () => {
  process.env.NODE_ENV = "test";
  process.env.DB_SQLITE_ENABLED = "true";
  process.env.DB_REDIS_ENABLED = "false";
  process.env.SQLITE_DB_PATH_1 = ":memory:";
};

const prepareSchema = async () => {
  const db = getSqliteDb("sqlite1");
  await baseExamplesMigration.up(db);
  await examplesCrudMigration.up(db);
};

const seedExample = async (overrides?: Partial<{
  full_name: string;
  email: string;
  password: string;
}>) => {
  return createExampleRecord({
    full_name: overrides?.full_name ?? "Example Alpha",
    email: overrides?.email ?? "example.alpha@example.com",
    password: overrides?.password ?? (await Bun.password.hash("secret123")),
  });
};

beforeEach(async () => {
  configureTestEnv();
  queuedPayloads.length = 0;
  cacheStore.clear();
  cacheOps.get.length = 0;
  cacheOps.set.length = 0;
  cacheOps.deleteByPattern.length = 0;
  closeAllSqliteConnections();
  await prepareSchema();
});

afterEach(() => {
  queuedPayloads.length = 0;
  cacheStore.clear();
  cacheOps.get.length = 0;
  cacheOps.set.length = 0;
  cacheOps.deleteByPattern.length = 0;
  closeAllSqliteConnections();
});

describe("examples CRUD", () => {
  test("create still works after crud migration down and up cycle", async () => {
    const db = getSqliteDb("sqlite1");

    await examplesCrudMigration.down(db);
    await examplesCrudMigration.up(db);

    const createdExample = await seedExample({
      full_name: "Rollback Safe",
      email: "rollback.safe@example.com",
    });

    expect(createdExample.full_name).toBe("Rollback Safe");
    expect(createdExample.created_at).toBeTruthy();
    expect(createdExample.updated_at).toBeTruthy();
  });

  test("POST /api/examples queues async creation and returns 202", async () => {
    const response = await app.request("/api/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Example Queue",
        email: "example.queue@example.com",
        password: "secret123",
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.message).toBe("Example creation queued");
    expect(body.data).toEqual({
      job_id: "job-create-example-1",
      status: "queued",
    });
    expect(queuedPayloads).toHaveLength(1);
    expect(queuedPayloads[0]?.email).toBe("example.queue@example.com");
    expect(queuedPayloads[0]?.passwordHash).not.toBe("secret123");
    expect(
      await Bun.password.verify(
        "secret123",
        queuedPayloads[0]!.passwordHash,
      ),
    ).toBe(true);
  });

  test("GET /api/examples returns paginated results with search filters", async () => {
    await seedExample();
    await seedExample({
      full_name: "Example Beta",
      email: "example.beta@example.com",
    });

    const response = await app.request(
      "/api/examples?page=1&limit=1&full_name=Beta",
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).toMatchObject({
      full_name: "Example Beta",
      email: "example.beta@example.com",
    });
    expect(cacheOps.set[0]?.key).toBe(
      "examples:list:full_name=Beta&limit=1&page=1",
    );
  });

  test("GET /api/examples serves repeated normal requests from Redis cache", async () => {
    await seedExample();

    const firstResponse = await app.request("/api/examples");
    const firstBody = await firstResponse.json();

    await seedExample({
      full_name: "Example Gamma",
      email: "example.gamma@example.com",
    });

    const secondResponse = await app.request("/api/examples");
    const secondBody = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstBody.data).toEqual(secondBody.data);
    expect(secondBody.data.items).toHaveLength(1);
    expect(cacheOps.get).toContain("examples:list:limit=10&page=1");
  });

  test("GET /api/examples caches search results with a distinct key", async () => {
    await seedExample({
      full_name: "Search Target",
      email: "search.target@example.com",
    });

    const response = await app.request(
      "/api/examples?email=search.target%40example.com&limit=5&page=1",
    );

    expect(response.status).toBe(200);
    expect(cacheOps.set[0]?.key).toBe(
      "examples:list:email=search.target%40example.com&limit=5&page=1",
    );
  });

  test("GET /api/examples/:id returns example detail", async () => {
    const example = await seedExample();
    const response = await app.request(`/api/examples/${example.id}`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: example.id,
      full_name: "Example Alpha",
      email: "example.alpha@example.com",
    });
  });

  test("PUT /api/examples/:id updates full_name, email, and password", async () => {
    const example = await seedExample();
    cacheStore.set("examples:list:limit=10&page=1", {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const response = await app.request(`/api/examples/${example.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Example Updated",
        email: "example.updated@example.com",
        password: "newsecret123",
      }),
    });

    const body = await response.json();
    const updatedExample = findExampleById(example.id);

    expect(response.status).toBe(200);
    expect(body.data).toMatchObject({
      id: example.id,
      full_name: "Example Updated",
      email: "example.updated@example.com",
    });
    expect(updatedExample?.password).toBeDefined();
    expect(
      await Bun.password.verify("newsecret123", updatedExample!.password),
    ).toBe(true);
    expect(cacheOps.deleteByPattern).toContain("examples:list:*");
  });

  test("DELETE /api/examples/:id performs soft delete", async () => {
    const example = await seedExample();
    cacheStore.set("examples:list:limit=10&page=1", {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const response = await app.request(`/api/examples/${example.id}`, {
      method: "DELETE",
    });

    const db = getSqliteDb("sqlite1");
    const deletedRow = db
      .query<{ deleted_at: string | null }, [number]>(
        "SELECT deleted_at FROM examples WHERE id = ? LIMIT 1",
      )
      .get(example.id);

    expect(response.status).toBe(200);
    expect(findExampleById(example.id)).toBeNull();
    expect(deletedRow?.deleted_at).toBeTruthy();
    expect(cacheOps.deleteByPattern).toContain("examples:list:*");
  });

  test("async create invalidates examples list cache after successful insert", async () => {
    cacheStore.set("examples:list:limit=10&page=1", {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    const createdExample = await createExampleFromJob({
      full_name: "Worker Example",
      email: "worker.example@example.com",
      passwordHash: await Bun.password.hash("secret123"),
    });

    expect(createdExample.email).toBe("worker.example@example.com");
    expect(cacheOps.deleteByPattern).toContain("examples:list:*");
    expect(cacheStore.has("examples:list:limit=10&page=1")).toBe(false);
  });
});
