import type { Context } from "hono";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { ROUTES } from "../../configs/routes.config.ts";

/**
 * OpenAPI 3.0 document generated from the live API router (passed as the
 * `targetApp` argument by the docs router — no self-mount cycle).
 */
export const createGetApiSpec =
  (targetApp: OpenAPIHono) => (c: Context) =>
    c.json(
      targetApp.getOpenAPIDocument({
        openapi: "3.0.0",
        info: { title: "Hono Multi-DB API", version: "1.0.0" },
      }),
    );

/**
 * Scalar interactive API reference UI; reads the spec from the /api/spec URL.
 */
export const getApiDocsUi = () =>
  apiReference({ spec: { url: ROUTES.SYSTEM.DOCS.SPEC } });
