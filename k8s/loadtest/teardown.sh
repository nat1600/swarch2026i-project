#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# Revert everything setup.sh changed and delete the load-test pods.
#
# Usage:  bash k8s/loadtest/teardown.sh
# Env overrides: NS, GW_DEPLOY, GW_CONTAINER, NGINX_DEPLOY
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NS="${NS:-default}"
GW_DEPLOY="${GW_DEPLOY:-gateway-deployment}"
GW_CONTAINER="${GW_CONTAINER:-gateway}"

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
kc() { kubectl -n "$NS" "$@"; }

echo ">>> Restoring gateway from committed manifest (production image, 2 replicas)"
# apply restores the image tag and replica count (both tracked in the manifest)...
kc apply -f "$ROOT/k8s/services/api-gateway.yaml"
# ...but `apply` won't strip the resource limits we added imperatively (they were
# never in the manifest's last-applied-config), so remove them explicitly.
kc patch "deploy/$GW_DEPLOY" --type=json \
  -p="[{\"op\":\"remove\",\"path\":\"/spec/template/spec/containers/0/resources\"}]" 2>/dev/null \
  || echo "    (no resource limits to remove — already clean)"

echo ">>> Restoring nginx-extension (2 replicas) from manifest"
bash "$ROOT/scripts/apply-nginx.sh"

echo ">>> Deleting load-test pods"
kc delete -f "$HERE/loadtest-pods.yaml" --ignore-not-found

echo ""
echo ">>> Teardown complete. Note: the /test/heavy nginx location and gateway"
echo "    handler remain in the source on this branch — they are inert on the"
echo "    production gateway image (the handler isn't compiled in -> 404)."
