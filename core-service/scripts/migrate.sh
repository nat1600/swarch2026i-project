#!/bin/bash
set -e

echo "Current migration state:"
uv run alembic current

echo "Running migrations..."
uv run alembic upgrade head

echo "Migration complete. Final state:"
uv run alembic current
