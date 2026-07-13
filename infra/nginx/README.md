# Load balancing with Nginx

Nginx sits at the edge (`:8080`) and load-balances across N replicas of the
`app` service. Only the LB is exposed to the host; the app replicas are reached
**only** through it.

```
                 ┌─────────────┐
host :8080  ───▶ │  lb (nginx) │
                 └──────┬──────┘
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       app (r1)    app (r2)    app (r3)     ← docker compose replicas
          └────────────┼────────────┘
                       ▼
                   postgres
```

## Run it

```bash
# Build + start with 3 app replicas behind the LB
docker compose up -d --build --scale app=3

# Send traffic — every response carries an `X-Upstream` header telling you
# which backend answered:
curl -i http://localhost:8080/api/health

# Watch the balancing across many requests:
for i in $(seq 1 30); do
  curl -s -D - -o /dev/null http://localhost:8080/api/health \
    | awk 'tolower($1)=="x-upstream:"{print $2}'
done | sort | uniq -c

# LB's own liveness (does not touch backends):
curl http://localhost:8080/lb-health

# Scale up/down live — nginx picks up new replicas via compose DNS:
docker compose up -d --scale app=5

# Tear down:
docker compose down
```

## Things to try (this is a practice repo)

- **Failover:** kill a replica and confirm requests keep returning 200 —
  `proxy_next_upstream` retries the next backend.
  ```bash
  docker kill backend-distributed-system-practices-app-2
  for i in $(seq 1 20); do curl -s -o /dev/null -w '%{http_code}\n' \
    http://localhost:8080/api/health; done   # all 200
  ```
- **Swap the strategy** in [`nginx.conf`](nginx.conf): comment out `least_conn;`
  for round-robin, or use `ip_hash;` for sticky sessions. Reload with
  `docker compose restart lb`.
- **Load test through the LB** instead of a single instance — point the existing
  autocannon runner at `http://localhost:8080` and compare 1 vs 3 vs 5 replicas.

## Key config (`nginx.conf`)

| Directive | Why it's there |
|---|---|
| `upstream backend { least_conn; }` | The pool + balancing strategy. |
| `server app:3000` | `app` is the compose service name; its DNS resolves to all replica IPs. |
| `max_fails=3 fail_timeout=10s` | Passive health check — eject a backend after 3 failures for 10s. |
| `proxy_next_upstream ...` | Retry the next backend on error/timeout so a dead node is invisible to clients. |
| `keepalive 32` + `proxy_http_version 1.1` + `Connection ""` | Reuse upstream connections — big latency win under load. |
| `X-Forwarded-For` / `X-Real-IP` | Preserve the real client IP for the app behind the proxy. |

## Notes

- The `app` service has **no host `ports` mapping** on purpose — replicas share
  port 3000 internally and would collide on a fixed host port. They're reachable
  only via the LB.
- Nginx does **passive** health checks (eject on failure). True **active**
  probing (`/api/health` polling) needs Nginx Plus or a swap to HAProxy — a
  natural next experiment for this repo.
