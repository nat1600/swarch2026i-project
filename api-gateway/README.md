# API Gateway

Go reverse-proxy gateway that routes external traffic to four internal microservices: `auth`, `core`, `forum`, and `game`.

## Architecture

Every request passes through this middleware chain before reaching an upstream service:

```
Client → Security → RequestID → Logging → CORS → RateLimit → Auth → ReverseProxy → Microservice
```

| Middleware | What it does |
|---|---|
| Security | Sets `X-Content-Type-Options`, `X-Frame-Options`, and HSTS (production only) |
| RequestID | Generates or propagates `X-Request-ID` across request and response |
| Logging | Logs method, path, status code, and duration after the request completes |
| CORS | Sets CORS headers; short-circuits OPTIONS preflight with 204 |
| RateLimit | Token bucket per IP — 10 req/s, burst of 20 |
| Auth | Validates Auth0 JWT; sets `X-User-Sub` from claims for upstream use |
| ReverseProxy | Strips path prefix and forwards to the target service; includes circuit breaker |

The circuit breaker per upstream opens after 5 consecutive 5xx responses and resets after 30 seconds.

## Route table

Defined in `config.json`. Path prefix is stripped before forwarding.

| Path prefix | Service | Example |
|---|---|---|
| `/api/auth` | auth | `/api/auth/login` → `/login` |
| `/api/core` | core | `/api/core/users` → `/users` |
| `/api/forum` | forum | `/api/forum/posts` → `/posts` |
| `/api/game` | game | `/api/game/scores` → `/scores` |
| `/api/gamification` | game | `/api/gamification/points` → `/points` |

### Adding a new service

Add an entry to `config.json`:

```json
{
  "path_prefix": "/api/myservice",
  "service_name": "myservice"
}
```

Then add the corresponding URL to `.env`:

```
SERVICE_MYSERVICE_URL=http://my-service:8080
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Port the gateway listens on (e.g. `8080`) |
| `ENVIRONMENT` | Yes | `production` enables HSTS; any other value disables it |
| `AUTH0_DOMAIN` | Yes | Auth0 domain without `https://` (e.g. `foo.us.auth0.com`) |
| `AUTH0_AUDIENCE` | Yes | Auth0 API audience (e.g. `https://my-api.com`) |
| `SERVICE_AUTH_URL` | Yes | Base URL of the auth service |
| `SERVICE_CORE_URL` | Yes | Base URL of the core service |
| `SERVICE_FORUM_URL` | Yes | Base URL of the forum service |
| `SERVICE_GAME_URL` | Yes | Base URL of the game/gamification service |

## Running locally

```bash
cp .env.example .env   # fill in values
go run ./cmd/main.go
```

The gateway logs a startup table with each registered service and its live health status.

```
GET /health   — probes each upstream's /health and returns aggregate status
```

## Running tests

```bash
go test ./...                        # all tests
go test ./internal/middleware/...    # middleware unit tests
go test ./internal/proxy/...         # proxy + circuit breaker tests
go test ./config/...                 # config loading tests
go test ./internal/router/... -v     # integration tests (starts real HTTP servers)
```
