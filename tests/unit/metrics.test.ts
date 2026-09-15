import { beforeEach, describe, expect, test } from "bun:test";
import {
  classifyRequestKind,
  httpRequestDurationMs,
  httpRequestsTotal,
  normalizeRoutePath,
  renderMetrics,
  resetMetrics,
} from "../../src/utils/metrics.util.ts";

describe("normalizeRoutePath", () => {
  test("converts :param into {param}", () => {
    expect(normalizeRoutePath("/api/example/cruds/:id")).toBe(
      "/api/example/cruds/{id}",
    );
  });

  test("maps wildcard to not_found", () => {
    expect(normalizeRoutePath("/*")).toBe("not_found");
  });

  test("keeps static paths unchanged", () => {
    expect(normalizeRoutePath("/api/health")).toBe("/api/health");
  });
});

describe("classifyRequestKind", () => {
  test("classifies /api paths as api", () => {
    expect(classifyRequestKind("/api/health", "/api")).toBe("api");
  });

  test("classifies non-api paths as web", () => {
    expect(classifyRequestKind("/", "/api")).toBe("web");
    expect(classifyRequestKind("/example/jsx", "/api")).toBe("web");
  });
});

describe("metrics registry", () => {
  beforeEach(() => {
    resetMetrics();
  });

  test("counter increments and renders Prometheus text", async () => {
    httpRequestsTotal.inc({
      method: "GET",
      path: "/api/health",
      status: "200",
      kind: "api",
    });

    const output = await renderMetrics();
    expect(output).toContain(
      'http_requests_total{method="GET",path="/api/health",status="200",kind="api"} 1',
    );
  });

  test("histogram records duration into cumulative buckets", async () => {
    httpRequestDurationMs.observe(
      { method: "GET", path: "/api/health", kind: "api" },
      14,
    );

    const output = await renderMetrics();
    expect(output).toMatch(
      /http_request_duration_ms_bucket\{[^}]*le="5"[^}]*\} 0/,
    );
    expect(output).toMatch(
      /http_request_duration_ms_bucket\{[^}]*le="25"[^}]*\} 1/,
    );
    expect(output).toContain(
      'http_request_duration_ms_count{method="GET",path="/api/health",kind="api"} 1',
    );
  });
});
