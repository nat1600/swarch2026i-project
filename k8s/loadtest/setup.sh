#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# Prepare the cluster for the DDoS / rate-limit load test. Idempotent.
#
# What it changes (all reverted by teardown.sh):
#   - gateway-deployment   -> loadtest image, 1 replica, 200m CPU / 64Mi limits.
#                             1 replica so the flood hits ONE constrained pod
#                             (like the single docker-compose container).
#   - nginx-extension      -> 1 replica. nginx's limit_req zone lives in each
#                             pod's own shared memory; with 2 replicas the
#                             effective per-IP budget would double and the
#                             attacker's traffic would split across two buckets.
#   - loadtest-attacker/legit pods -> created.
#
# Prereq: build + push the loadtest gateway image first (see README.md), e.g.
#   cd api-gateway && docker buildx build --platform linux/amd64,linux/arm64 \
#     -t vmoras/api-gateway-container:v1.0.1-ddos --push .
#
# Usage:  bash k8s/loadtest/setup.sh
# Env overrides: NS, GW_DEPLOY, GW_CONTAINER, NGINX_DEPLOY, IMAGE
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

NS="${NS:-default}"
GW_DEPLOY="${GW_DEPLOY:-gateway-deployment}"
GW_CONTAINER="${GW_CONTAINER:-gateway}"
NGINX_DEPLOY="${NGINX_DEPLOY:-nginx-extension-deployment}"
IMAGE="${IMAGE:-vmoras/api-gateway-container:v1.0.1-ddos}"

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
kc() { kubectl -n "$NS" "$@"; }

echo ">>> Creating load-test client pods"
kc apply -f "$HERE/loadtest-pods.yaml"

echo ">>> Reconfiguring gateway: image=$IMAGE, 1 replica, 200m CPU / 64Mi limit"
kc set image "deploy/$GW_DEPLOY" "$GW_CONTAINER=$IMAGE"
kc scale "deploy/$GW_DEPLOY" --replicas=1
# Strategic-merge patch keyed on the container name -> idempotent (safe to re-run).
kc patch "deploy/$GW_DEPLOY" -p \
  "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$GW_CONTAINER\",\"resources\":{\"limits\":{\"cpu\":\"200m\",\"memory\":\"64Mi\"}}}]}}}}"

echo ">>> Re-applying nginx so the /test/heavy location is picked up"
bash "$ROOT/scripts/apply-nginx.sh"
echo ">>> Scaling nginx-extension to a single replica (deterministic per-IP zone)"
kc scale "deploy/$NGINX_DEPLOY" --replicas=1

echo ">>> Waiting for rollouts and pods..."
kc rollout status "deploy/$GW_DEPLOY" --timeout=120s
kc rollout status "deploy/$NGINX_DEPLOY" --timeout=120s
kc wait --for=condition=Ready pod/loadtest-attacker pod/loadtest-legit --timeout=120s

echo ""
echo ">>> Setup complete. Next: bash $HERE/test-ddos-k8s.sh"
echo ">>> When done:        bash $HERE/teardown.sh"
