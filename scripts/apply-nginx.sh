#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────
# Apply the nginx Kustomization (web-app + extension + their ConfigMaps).
#
# Why this wrapper exists:
#   - The kustomization.yaml references nginx config files at ../../nginx/
#   - Kustomize's default load restrictor blocks reads outside the kustomization dir
#   - kubectl's embedded kustomize doesn't expose the flag to relax this
#   - So we shell out to the standalone `kustomize` binary with the flag
#
# Prerequisites:
#   - `kustomize` standalone installed (see k8s/nginx/README.md, step 2)
#   - `nginx-tls` Secret created (run nginx/generate-certs-linux.sh first)
#
# Usage:
#   bash scripts/apply-nginx.sh
# ────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

kustomize build \
  --load-restrictor=LoadRestrictionsNone \
  "$PROJECT_ROOT/k8s/nginx/" \
  | kubectl apply -f -
