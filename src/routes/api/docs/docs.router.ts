import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";

/**
 * Creates OpenAPI documentation sub-router (/spec, /docs).
 * Binds dynamically to the parent application's route registry.
 */
export const createDocsRouter = (targetApp: OpenAPIHono): OpenAPIHono => {
  const docs = new OpenAPIHono();

  // Dynamically generate OpenAPI 3.0 spec from targetApp routes
  docs.get("/spec", (c) => {
    return c.json(
      targetApp.getOpenAPIDocument({
        openapi: "3.0.0",
        info: { title: "Hono Multi-DB API", version: "1.0.0" },
      }),
    );
  });

  // Scalar interactive API reference UI
  docs.get("/docs", apiReference({ spec: { url: "/api/spec" } }));

  return docs;
};
