# auth-service

Microservice responsible for user identity within the platform. It validates Auth0 JWT tokens on every request, manages user registration, and tracks the last login timestamp. All other services treat the `auth0_id` (the `sub` claim from the token) as the canonical user identifier.

See the [database schema](../docs/database/auth-service.mermaid) and the [architecture overview](../docs/architecture.mermaid) for broader context.

---

## Tech stack

- **FastAPI** — async HTTP framework
- **SQLAlchemy 2 (async)** + **asyncpg** — database access
- **PostgreSQL 16** — persistence
- **Auth0** (RS256) — token issuance and key management
- **Alembic** — schema migrations
- **uv** — package and environment management

---

## Prerequisites

- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (only needed to run tests locally)

---

## Running the service

**1. Create your `.env` file**

```bash
cp .env.example .env
```

Fill in each variable — descriptions are in `.env.example`. The table below summarises what each one controls:

| Variable             | Description                                                   |
|----------------------|---------------------------------------------------------------|
| `POSTGRES_DB`        | Database name (e.g. `auth_db`)                                |
| `POSTGRES_USER`      | PostgreSQL role the service connects as                       |
| `POSTGRES_HOST`      | `auth_database` when running in Docker, `localhost` otherwise |
| `POSTGRES_PASSWORD`  | Password for the role above                                   |
| `POSTGRES_PORT`      | Port PostgreSQL listens on (e.g. `5432`)                      |
| `AUTH0_DOMAIN`       | Your Auth0 tenant domain (e.g. `something.us.auth0.com`)      |
| `AUTH0_API_AUDIENCE` | API identifier registered in Auth0                            |
| `DEBUG`              | `true` enables the interactive docs at `/docs`                |
| `CORS_ORIGINS`       | Comma-separated list of allowed CORS origins                  |

**2. Start the service**

```bash
docker compose up
```

This starts PostgreSQL, runs Alembic migrations, and seeds the `languages` table automatically before the API is available. The API is served on port `8000`.

> Set `DEBUG=true` in `.env` to access the interactive docs at http://localhost:8000/docs.

> The database is exposed on `POSTGRES_PORT`, so you can connect to it directly with any PostgreSQL client (e.g. psql, TablePlus, DBeaver) using the credentials from your `.env`.

---

## Endpoints

All endpoints require a valid Auth0 Bearer token:

```
Authorization: Bearer <access_token>
```

---

### `GET /users/exists`

Checks whether the authenticated user already has a registered profile. If they do, their `last_login_at` is updated to now.

**Response**

```jsonc
// User found
{
  "data": {
    "id": "auth0|abc123",
    "email": "user@example.com",
    "native_language": { "id": 1, "name": "English" },
    "learning_language": { "id": 2, "name": "Spanish" },
    "accumulated_points": 0,
    "last_login_at": "2026-03-10T12:00:00Z"
  }
}

// User not found
{ "data": null }
```

---

### `POST /users/register`

Registers the authenticated user for the first time. The `auth0_id` is extracted from the token — it must not already exist in the database.

**Request body**

```json
{
  "email": "user@example.com",
  "username": "myusername",
  "native_language": "English",
  "learning_language": "Spanish",
  "timezone": "America/New_York"
}
```

> `native_language` and `learning_language` must match a name in the `languages` table exactly.

**Response** — the newly created user, same shape as `GET /users/exists`.

**Error responses**

| Status | Reason                                                                  |
|--------|-------------------------------------------------------------------------|
| `401`  | Missing or invalid Auth0 token                                          |
| `409`  | A user with this `auth0_id` is already registered                       |
| `422`  | `native_language` or `learning_language` does not exist in the database |

---

## Running tests

The test suite uses a separate database (`<POSTGRES_DB>_test`) that is created automatically on first run.

PostgreSQL must be reachable before running tests. If you are not already running the full stack, start just the database:

```bash
docker compose up auth_database
```

Then run the tests:

```bash
uv run pytest -v
```

Tests are isolated — each test runs inside a transaction that is rolled back at the end, so no data persists between tests.
