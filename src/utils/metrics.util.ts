import { Counter, Histogram, Registry } from "prom-client";

export const registry = new Registry();

export const HTTP_DURATION_BUCKETS_MS = [
  5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000,
];

export const QUEUE_DURATION_BUCKETS_MS = [
  50, 100, 250, 500, 1000, 2500, 5000, 10000,
];

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status", "kind"],
  registers: [registry],
});

export const httpRequestDurationMs = new Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  labelNames: ["method", "path", "kind"],
  buckets: HTTP_DURATION_BUCKETS_MS,
  registers: [registry],
});

export const classifyRequestKind = (path: string, apiBasePath: string): string =>
  path.startsWith(apiBasePath) ? "api" : "web";

export const queueJobsTotal = new Counter({
  name: "queue_jobs_total",
  help: "Total number of processed queue jobs",
  labelNames: ["queue", "status"],
  registers: [registry],
});

export const queueJobDurationMs = new Histogram({
  name: "queue_job_duration_ms",
  help: "Queue job duration in milliseconds",
  labelNames: ["queue"],
  buckets: QUEUE_DURATION_BUCKETS_MS,
  registers: [registry],
});

/**
 * Converts a Hono route path into a low-cardinality label value.
 * Example: "/api/example/cruds/:id" -> "/api/example/cruds/{id}"
 */
export const normalizeRoutePath = (routePath: string): string => {
  if (!routePath || routePath === "/*") return "not_found";
  return routePath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
};

export const renderMetrics = (): Promise<string> => registry.metrics();

export const metricsContentType = registry.contentType;

export const resetMetrics = (): void => registry.resetMetrics();
