import { afterAll, describe, expect, test } from "bun:test";
import { setupTestEnvironment } from "../helpers/setup.ts";
import { resetConfigApp } from "../../src/configs/index.ts";
import { ROUTES } from "../../src/configs/routes.config.ts";

setupTestEnvironment({ API_DOCS_ENABLED: "true" });

import { app } from "../../src/app.ts";
import { Hono } from "hono";
import { setupMiddlewares } from "../../src/middlewares/index.ts";
import { registerAllRoutes } from "../../src/routes/index.ts";

/**
 * Collects every leaf path constant under a registry block. Used to derive
 * the golden path list from ROUTES.API itself, so a new endpoint registered
 * in the registry becomes part of the expected list automatically — the
 * test then fails when the OpenAPI spec disagrees with the registry.
 */
const collectPaths = (block: object): string[] => {
  const paths: string[] = [];
  for (const value of Object.values(block)) {
    if (typeof value === "string") paths.push(value);
    else paths.push(...collectPaths(value));
  }
  return paths;
};

// ROUTES.API.BASE_PATH ("/api") is a mount prefix, not an endpoint.
const { BASE_PATH: _base, ...endpointBlocks } = ROUTES.API;
const EXPECTED_API_PATHS = new Set(collectPaths(endpointBlocks));

describe("API route contract (registry ↔ OpenAPI spec)", () => {
  test("spec paths match the ROUTES.API registry exactly", async () => {
    const res = await app.fetch(new Request("http://localhost/api/spec"));
    expect(res.status).toBe(200);

    const spec = (await res.json()) as { paths: Record<string, unknown> };
    const specPaths = new Set(Object.keys(spec.paths));

    expect([...specPaths].sort()).toEqual([...EXPECTED_API_PATHS].sort());
  });

  test("system endpoints (metrics, docs) are not part of the API spec", async () => {
    const res = await app.fetch(new Request("http://localhost/api/spec"));
    const spec = (await res.json()) as { paths: Record<string, unknown> };

    for (const path of Object.keys(spec.paths)) {
      expect(path).not.toBe(ROUTES.SYSTEM.METRICS);
      expect(path).not.toBe(ROUTES.SYSTEM.DOCS.SPEC);
      expect(path).not.toBe(ROUTES.SYSTEM.DOCS.UI);
    }
  });
});

describe("API docs gate (API_DOCS_ENABLED)", () => {
  test("spec and Scalar UI respond when the flag is true", async () => {
    const spec = await app.fetch(new Request("http://localhost/api/spec"));
    expect(spec.status).toBe(200);

    const ui = await app.fetch(new Request("http://localhost/api/docs"));
    expect(ui.status).toBe(200);
    expect(await ui.text()).toContain("Scalar");
  });

  test("spec and Scalar UI are absent (natural 404) when the flag is false", async () => {
    process.env.API_DOCS_ENABLED = "false";
    resetConfigApp();
    const gatedApp = new Hono();
    setupMiddlewares(gatedApp);
    registerAllRoutes(gatedApp);

    try {
      const spec = await gatedApp.fetch(
        new Request("http://localhost/api/spec"),
      );
      expect(spec.status).toBe(404);

      const ui = await gatedApp.fetch(
        new Request("http://localhost/api/docs"),
      );
      expect(ui.status).toBe(404);
    } finally {
      // Restore the shared process env/config for other suites.
      process.env.API_DOCS_ENABLED = "true";
      resetConfigApp();
    }
  });

  afterAll(() => {
    process.env.API_DOCS_ENABLED = "true";
    resetConfigApp();
  });
});
