import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { successResponse, errorResponse } from "../../src/utils/response.util.ts";

describe("successResponse", () => {
  test("returns 200 with correct shape", async () => {
    const app = new Hono();
    app.get("/test", (c) => successResponse(c, "ok", { id: 1 }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      status: "success",
      message: "ok",
      data: { id: 1 },
    });
  });

  test("accepts custom status code", async () => {
    const app = new Hono();
    app.get("/created", (c) => successResponse(c, "created", null, 201));

    const res = await app.request("/created");
    expect(res.status).toBe(201);
  });
});

describe("errorResponse", () => {
  test("returns 500 with error shape by default", async () => {
    const app = new Hono();
    app.get("/err", (c) => errorResponse(c, "internal"));

    const res = await app.request("/err");
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body).toEqual({
      status: "error",
      message: "internal",
      data: null,
    });
  });

  test("accepts custom status and data", async () => {
    const app = new Hono();
    app.get("/bad", (c) => errorResponse(c, "bad request", 400, { field: "name" }));

    const res = await app.request("/bad");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.data).toEqual({ field: "name" });
  });
});
