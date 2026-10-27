import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { jsonOnlyMiddleware } from "../../src/middlewares/api/contentType.middleware.ts";
import { AppError } from "../../src/utils/errors.util.ts";

describe("jsonOnlyMiddleware", () => {
  const createApp = () => {
    const app = new Hono();
    app.onError((err, c) => {
      if (err instanceof AppError) {
        return c.text(err.message, err.statusCode as any);
      }
      return c.text("Internal Server Error", 500);
    });
    app.use("*", jsonOnlyMiddleware);
    app.get("/test", (c) => c.text("ok"));
    app.post("/test", (c) => c.text("created"));
    return app;
  };

  it("allows GET requests without content-type", async () => {
    const app = createApp();
    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("allows POST with application/json", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });
    expect(res.status).toBe(200);
  });

  it("allows POST with multipart/form-data", async () => {
    const app = createApp();
    const formData = new FormData();
    formData.append("file", "dummy-content");

    const res = await app.request("/test", {
      method: "POST",
      body: formData,
    });
    expect(res.status).toBe(200);
  });

  it("allows empty POST without content-type and body", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      method: "POST",
      headers: { "Content-Length": "0" },
    });
    expect(res.status).toBe(200);
  });

  it("rejects POST with unsupported content-type", async () => {
    const app = createApp();
    const res = await app.request("/test", {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: "<xml></xml>",
    });
    expect(res.status).toBe(415);
  });
});
