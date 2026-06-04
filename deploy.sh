#!/usr/bin/env bash
set -euo pipefail

SERVER="root@187.77.27.201"
REMOTE_DIR="/root/swarch2026i-project"

echo "==> Deploying to $SERVER"

# ── 1. Copy SSH key (one-time setup) ─────────────────────────────────────────
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER" true 2>/dev/null; then
  echo ""
  echo "SSH key not set up yet. Run the following once to enable key-based auth:"
  echo "  ssh-copy-id $SERVER"
  echo ""
  echo "Then re-run this script."
  exit 1
fi

# ── 2. Sync project files to server ──────────────────────────────────────────
echo "==> Syncing files..."
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.venv' \
  --exclude='build.log' \
  ./ "$SERVER:$REMOTE_DIR/"

# ── 3. Generate self-signed SSL certs (if not already present) ───────────────
echo "==> Checking SSL certs..."
ssh "$SERVER" bash <<'REMOTE'
CERT_DIR="/root/swarch2026i-project/nginx/certs"
mkdir -p "$CERT_DIR"
if [ ! -f "$CERT_DIR/selfsigned.crt" ]; then
  echo "Generating self-signed SSL certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$CERT_DIR/selfsigned.key" \
    -out "$CERT_DIR/selfsigned.crt" \
    -subj "/C=CO/ST=Bogota/L=Bogota/O=Parla/CN=187.77.27.201"
  echo "Certs generated."
else
  echo "Certs already present, skipping."
fi
REMOTE

# ── 4. Build and start all services ──────────────────────────────────────────
echo "==> Starting services on server..."
ssh "$SERVER" bash <<'REMOTE'
cd /root/swarch2026i-project
docker compose pull --ignore-buildable 2>/dev/null || true
docker compose up --build -d
echo "==> Done. Container status:"
docker compose ps
REMOTE

echo ""
echo "Deployment complete."
echo "  Web app:   https://187.77.27.201"
echo "  Extension: https://187.77.27.201:8443"
echo ""
echo "If this is your first deploy, fill in CHANGE_ME values in:"
echo "  api-gateway/.env        (AUTH0_DOMAIN, AUTH0_AUDIENCE)"
echo "  web-app/parla/.env      (AUTH0_*, APP_BASE_URL)"
echo "  enrichment-service/.env (ANTHROPIC_API_KEY)"
echo "Then re-run this script."
