import type { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

export const registerDocsRoutes = (app: OpenAPIHono): void => {
  app.doc("/api/spec", {
    openapi: "3.0.0",
    info: { title: "Hono Multi-DB API", version: "1.0.0" },
  });

  app.get("/api/docs", apiReference({ spec: { url: "/api/spec" } }));
};
