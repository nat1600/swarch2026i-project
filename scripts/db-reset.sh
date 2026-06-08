#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────
# One-shot DB reset for the Parla project.
#
# What it does:
#   1. Pulls credentials from the k8s Secrets already applied to the cluster
#      (single source of truth — no duplication in .env files).
#   2. For each Postgres-backed service (auth, core):
#        - DROP SCHEMA public CASCADE  (nukes everything)
#        - CREATE SCHEMA public
#        - alembic upgrade head        (rebuilds from migration files)
#   3. For the forum service (Mongo):
#        - drop_database(DB_NAME)
#        - run seed_categories
#
# Prerequisites:
#   - kubectl configured (KUBECONFIG pointing at ~/.kube/config)
#   - k8s/secrets/ already applied (`kubectl apply -f k8s/secrets/`)
#   - uv installed (for auth-service and core-service)
#   - forum-service/api has its own venv with requirements.txt installed
#
# Usage:
#   bash scripts/db-reset.sh
# ────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Read a base64-encoded value from a k8s Secret and decode it.
get_secret() {
  kubectl get secret "$1" -o jsonpath="{.data.$2}" | base64 -d
}

# ─── POSTGRES ──────────────────────────────────────────────────────────
reset_postgres() {
  local service=$1
  local secret_name=$2

  echo ""
  echo "─── [$service] Postgres ────────────────────────────────────"

  export POSTGRES_HOST=$(get_secret "$secret_name" "POSTGRES_HOST")
  export POSTGRES_PORT=$(get_secret "$secret_name" "POSTGRES_PORT")
  export POSTGRES_USER=$(get_secret "$secret_name" "POSTGRES_USER")
  export POSTGRES_PASSWORD=$(get_secret "$secret_name" "POSTGRES_PASSWORD")
  export POSTGRES_DB=$(get_secret "$secret_name" "POSTGRES_DB")

  cd "$PROJECT_ROOT/$service"

  # Nuclear reset: kill every table, sequence, view, function in `public`.
  # `--with psycopg2-binary` ensures the driver is available regardless of
  # what the service uses for its own runtime (auth uses asyncpg, core uses psycopg2).
  uv run --with psycopg2-binary python <<'PYEOF'
import os
import psycopg2

conn = psycopg2.connect(
    host=os.environ["POSTGRES_HOST"],
    port=os.environ["POSTGRES_PORT"],
    user=os.environ["POSTGRES_USER"],
    password=os.environ["POSTGRES_PASSWORD"],
    dbname=os.environ["POSTGRES_DB"],
    sslmode="require",
)
conn.autocommit = True
cur = conn.cursor()
cur.execute("DROP SCHEMA public CASCADE")
cur.execute("CREATE SCHEMA public")
cur.close()
conn.close()
print(f"  ✓ Dropped + recreated 'public' schema in {os.environ['POSTGRES_DB']}")
PYEOF

  # Rebuild schema from migration files.
  uv run alembic upgrade head
}

# ─── MONGO ─────────────────────────────────────────────────────────────
reset_mongo() {
  echo ""
  echo "─── [forum-service] Mongo ─────────────────────────────────"

  # Code reads LOCAL_URI when ENV=local (see forum-service/api/db/mongo.py).
  export LOCAL_URI=$(get_secret "forum-secret" "LOCAL_URI")
  export DB_NAME=$(get_secret "forum-secret" "DB_NAME")
  export ENV="local"

  # Pydantic Settings demands these even if not used at runtime when ENV=local.
  # Reading them from the Secret keeps the cluster as the single source of truth.
  export ATLAS_USER=$(get_secret "forum-secret" "ATLAS_USER")
  export ATLAS_PASS=$(get_secret "forum-secret" "ATLAS_PASS")
  export ATLAS_CLUSTER=$(get_secret "forum-secret" "ATLAS_CLUSTER")

  cd "$PROJECT_ROOT/forum-service/api"

  # Forum uses requirements.txt (not pyproject.toml). We tell uv to spin up an
  # ephemeral env with all forum deps installed. --with pymongo because motor's
  # sync sibling is what we use for drop_database (faster than spinning up asyncio).
  uv run --no-project \
    --with-requirements requirements.txt \
    --with pymongo \
    python <<'PYEOF'
import os
from pymongo import MongoClient

client = MongoClient(os.environ['LOCAL_URI'])
db_name = os.environ['DB_NAME']
client.drop_database(db_name)
print(f"  ✓ Dropped database '{db_name}'")
PYEOF

  # The seed script imports from db.* and settings.* (the forum app modules),
  # so we need PYTHONPATH=. to make them importable.
  PYTHONPATH=. uv run --no-project \
    --with-requirements requirements.txt \
    python -m scripts.seed_categories
}

# ─── Run all ───────────────────────────────────────────────────────────
reset_postgres "auth-service" "auth-secret"
reset_postgres "core-service" "core-secret"
reset_mongo

echo ""
echo "─── Done ──────────────────────────────────────────────────"
