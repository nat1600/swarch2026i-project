#!/bin/bash
set -euo pipefail

uv run python - <<'PY'
import asyncio
import os
from urllib.parse import urlsplit, urlunsplit

import asyncpg


def quote_identifier(identifier: str) -> str:
    return identifier.replace('"', '""')


database_url = os.environ["DATABASE_URL"]
parts = urlsplit(database_url)
database_name = parts.path.lstrip("/")

if not database_name:
    raise RuntimeError("DATABASE_URL must include a database name")

admin_scheme = parts.scheme.split("+", 1)[0]
admin_url = urlunsplit(parts._replace(scheme=admin_scheme, path="/postgres"))


async def ensure_database_exists() -> None:
    connection = await asyncpg.connect(admin_url)
    try:
        database_exists = await connection.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            database_name,
        )
        if not database_exists:
            await connection.execute(
                f'CREATE DATABASE "{quote_identifier(database_name)}"'
            )
    finally:
        await connection.close()


asyncio.run(ensure_database_exists())
PY

uv run alembic upgrade head
