import { Hono } from "hono";
import type { OpenAPIHono } from "@hono/zod-openapi";
import {
  createGetApiSpec,
  getApiDocsUi,
} from "../../../controllers/system/docs.controller.ts";
import { ROUTES } from "../../../configs/routes.config.ts";

const DOCS = ROUTES.SYSTEM.DOCS;

/**
 * OpenAPI documentation router (/api/spec, /api/docs).
 * Lives under routes/system/ (not routes/api/) because these endpoints are
 * developer tooling, not part of the OpenAPI contract itself. Mounted from
 * src/routes/index.ts only when API_DOCS_ENABLED is true.
 */
export const createDocsRouter = (targetApp: OpenAPIHono): Hono => {
  const docs = new Hono();

  // Dynamically generate the OpenAPI 3.0 spec from the live API routes
  docs.get(DOCS.SPEC, createGetApiSpec(targetApp));

  // Scalar interactive API reference UI
  docs.get(DOCS.UI, getApiDocsUi());

  return docs;
};
