# Prometheus Metrics Guide

The application exposes ready-to-use Prometheus metrics at `GET /metrics` for scrapers and observability platforms (such as Prometheus, VictoriaMetrics, Datadog, or Grafana Agent).

---

## ⚙️ Enabling Metrics

By default, the metrics endpoint is disabled (`404 Not Found`). To enable it, configure your `.env` file:

```env
METRICS_ENABLED=true    # true -> Enables the /metrics endpoint
METRICS_TOKEN=          # Optional: Shared secret token for authorization
```

When `METRICS_TOKEN` is set (e.g., `METRICS_TOKEN=secret123`), scrapers must supply the token in an HTTP header:

```http
x-metrics-token: secret123
```
Requests lacking a valid token will be rejected with **401 Unauthorized**.

---

## 📊 Available Metrics

| Metric Name | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | Counter | `method`, `path`, `status`, `kind` | Total count of incoming HTTP requests |
| `http_request_duration_ms` | Histogram | `method`, `path`, `kind` | HTTP request duration distribution (milliseconds) |
| `queue_jobs_total` | Counter | `queue`, `status` | Total count of processed BullMQ jobs |
| `queue_job_duration_ms` | Histogram | `queue` | BullMQ job duration distribution (milliseconds) |

### Label Conventions:
- `path`: Uses normalized route patterns (e.g., `/api/example/cruds/{id}`), not raw URL paths like `/api/example/cruds/123`, preventing cardinality explosions in metric backends.
- `kind`: Categorized as `api` for endpoints starting with `/api`, and `web` for SSR pages.

---

## 🛡️ Scrape Exclusions

The `GET /metrics` endpoint is excluded from:
1. **Rate Limiting**: Scraper requests are never blocked by rate limit policies.
2. **Request Logging**: Scrapes do not produce noise in `info.jsonl` files.
3. **Self-Counting**: Calls to `/metrics` do not increment `http_requests_total`.

---

## 🔌 Example Prometheus Configuration (`prometheus.yml`)

```yaml
scrape_configs:
  - job_name: 'hono-multi-db-api'
    scrape_interval: 15s
    metrics_path: '/metrics'
    # When using METRICS_TOKEN:
    # http_headers:
    #   x-metrics-token: "secret123"
    static_configs:
      - targets: ['localhost:8080']
```

---

[Back to Guides](../README.md)
