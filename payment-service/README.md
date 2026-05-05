# payment-service

Microservice responsible for creating MercadoPago checkout sessions and tracking payment state for Parla VIP purchases. Authentication is handled by the API Gateway; this service trusts the `X-User-Sub` header forwarded by the gateway.

## Tech stack

- FastAPI
- SQLAlchemy 2 (async)
- PostgreSQL 16
- Alembic
- MercadoPago REST API via `httpx`

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Async PostgreSQL connection string |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago private access token |
| `MERCADOPAGO_PUBLIC_KEY` | Optional public key for frontend integrations |
| `MERCADOPAGO_NOTIFICATION_URL` | Optional public webhook URL for MercadoPago callbacks |
| `VIP_PRICE` | Price used for the VIP plan |
| `VIP_CURRENCY` | Currency code, default `COP` |
| `VIP_TITLE` | Checkout item title |
| `VIP_DESCRIPTION` | Checkout item description |
| `DEBUG` | Enables `/docs` when `true` |

## Endpoints

All user-facing endpoints require the gateway to forward `X-User-Sub`.

- `POST /payments/checkout` creates a MercadoPago checkout preference and returns the redirect URL.
- `POST /payments/webhook` processes MercadoPago payment notifications and updates the stored payment.
- `GET /payments/me` lists the current user's payments.
- `GET /payments/{payment_id}` fetches one payment owned by the current user.
- `GET /health` returns service health.

## Local run

The migration script creates the target database if it does not already exist, which helps when reusing an existing Postgres volume.

```bash
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8005
```
