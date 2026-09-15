# Metrics

The application exposes Prometheus metrics at `GET /metrics`.

## Enable

```env
METRICS_ENABLED=true    # default false -> endpoint returns 404
METRICS_TOKEN=          # optional shared secret
```

Restart the process after changing `.env`. When enabled and `METRICS_TOKEN` is
set, requests must include the header:

```http
x-metrics-token: <your-token>
```

Otherwise the endpoint returns `401`.

## Available Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | counter | `method`, `path`, `status`, `kind` | Total HTTP requests |
| `http_request_duration_ms` | histogram | `method`, `path`, `kind` | Request duration in milliseconds |
| `queue_jobs_total` | counter | `queue`, `status` | Processed queue jobs |
| `queue_job_duration_ms` | histogram | `queue` | Job duration in milliseconds |

Labels:

- `path` uses the route pattern (e.g. `/api/example/cruds/{id}`), never the raw
  path — this keeps cardinality low.
- `kind` is `api` for paths starting with `/api`, otherwise `web`.

Example output:

```text
http_requests_total{method="GET",path="/api/health",status="200",kind="api"} 2
http_request_duration_ms_bucket{le="25",method="GET",path="/api/health",kind="api"} 1
http_request_duration_ms_sum{method="GET",path="/api/health",kind="api"} 24
http_request_duration_ms_count{method="GET",path="/api/health",kind="api"} 2
```

## Exclusions

`/metrics` is excluded from:

- the rate limiter (scrapes are never blocked),
- the request logger (no log noise),
- the metrics middleware itself (no self-counting).

## Scraping with Prometheus

```yaml
scrape_configs:
  - job_name: hono-multi-db-api
    scrape_interval: 15s
    metrics_path: /metrics
    static_configs:
      - targets: ["api.internal:8080"]
    # if METRICS_TOKEN is set:
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/metrics_token
```

Note: the current implementation reads the token from the `x-metrics-token`
header, not `Authorization`. Adjust accordingly, e.g. use a reverse proxy to
inject the header, or use `http_headers` in a newer Prometheus config.

## Known Issue: Queue Metrics

`queue_jobs_total` / `queue_job_duration_ms` are recorded in the **worker
process**, which does not run an HTTP server. They are therefore not scrapeable
from the API `/metrics` endpoint. Options: expose `/metrics` in the worker on a
separate port, or push metrics to a gateway.

## Operational Notes

- Metrics live in memory; Prometheus stores the time series.
- Counters reset when the process restarts — use `rate()`/`increase()` in
  queries, not raw totals.
- Keep an eye on cardinality: always use route patterns for labels.

[Back to Docs](../README.md)
