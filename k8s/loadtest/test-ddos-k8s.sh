#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────────
# Two-phase DDoS / rate-limit test, k8s edition.
#
# Phase 1 (DIRECT):  attacker pod floods the gateway ClusterIP directly,
#                    bypassing nginx. No protection -> the constrained gateway
#                    saturates and the legit user (hitting the same endpoint)
#                    suffers.
# Phase 2 (PROXY):   attacker pod floods nginx, which rate-limits per source IP.
#                    The legit user is a SEPARATE pod (different pod IP), so its
#                    bucket is untouched and it stays fast.
#
# This mirrors the original docker-compose test-ddos.sh, swapping
#   docker exec <container>   ->   kubectl exec <pod>
#   host/container URLs       ->   in-cluster Service DNS
#
# Prereq: run setup.sh first.   Usage: bash k8s/loadtest/test-ddos-k8s.sh
# ────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ─── CONFIG ─────────────────────────────────────────────────────────────────
NS="${NS:-default}"
ATTACKER_POD="${ATTACKER_POD:-loadtest-attacker}"
LEGIT_POD="${LEGIT_POD:-loadtest-legit}"
GW_DEPLOY="${GW_DEPLOY:-gateway-deployment}"

DIRECT_URL="http://api-gateway:8080/test/heavy"            # ClusterIP, no proxy
PROXY_URL="https://nginx-extension-service/test/heavy"     # through nginx
VHOST="api.parla.bar"                                       # must match server_name
DURATION="${DURATION:-30s}"
CONCURRENCY="${CONCURRENCY:-200}"
LEGIT_INTERVAL="${LEGIT_INTERVAL:-2}"                       # seconds between legit reqs
RESULTS_DIR="${RESULTS_DIR:-./ddos-test-results}"

mkdir -p "$RESULTS_DIR"
kc() { kubectl -n "$NS" "$@"; }

# ─── HELPERS ────────────────────────────────────────────────────────────────
log()  { echo -e "\n\033[1;36m>>> $1\033[0m"; }
warn() { echo -e "\033[1;33m    $1\033[0m"; }

# hey, run INSIDE the attacker pod. $1=extra args, remaining=url
hey_in_pod() { kc exec "$ATTACKER_POD" -- hey "$@"; }

# Legit user sampled from the legit pod (its own pod IP) against $1, writing csv $2.
# Loops until the flood process ($HEY_PID) exits.
run_legit_user() {
    local url="$1" out="$2" extra_host="${3:-}"
    echo "timestamp,status,time_total" > "$out"
    local host_arg=()
    [ -n "$extra_host" ] && host_arg=(-H "Host: $extra_host")
    while kill -0 "$HEY_PID" 2>/dev/null; do
        local ts result
        ts=$(date +%H:%M:%S)
        result=$(kc exec "$LEGIT_POD" -- curl -sk "${host_arg[@]}" \
            -o /dev/null -w "%{http_code},%{time_total}" --max-time 5 \
            "$url" 2>/dev/null || echo "000,0.000")
        echo "${ts},${result}" >> "$out"
        sleep "$LEGIT_INTERVAL"
    done
}

print_legit_summary() {
    local file="$1" total ok slow timeout avg_time
    total=$(tail -n +2 "$file" | wc -l | tr -d ' ')
    ok=$(tail -n +2 "$file" | awk -F',' '$2 == 200' | wc -l | tr -d ' ')
    slow=$(tail -n +2 "$file" | awk -F',' '$2 == 200 && $3 > 0.5' | wc -l | tr -d ' ')
    timeout=$(tail -n +2 "$file" | awk -F',' '$2 == 0 || $2 == "000"' | wc -l | tr -d ' ')
    avg_time=$(tail -n +2 "$file" | awk -F',' '{sum+=$3; n++} END {if(n>0) printf "%.3f", sum/n; else print "N/A"}')
    echo "  Samples:          $total"
    echo "  Successful (200): $ok / $total"
    echo "  Slow (>500ms):    $slow"
    echo "  Timeouts/errors:  $timeout"
    echo "  Avg response:     ${avg_time}s"
}

# ─── PRE-FLIGHT CHECKS ──────────────────────────────────────────────────────
log "Pre-flight checks"

command -v kubectl &>/dev/null || { echo "ERROR: kubectl not found"; exit 1; }
kc get pod "$ATTACKER_POD" "$LEGIT_POD" &>/dev/null || {
    echo "ERROR: load-test pods not found. Run setup.sh first."; exit 1; }

echo -n "  Direct endpoint ($DIRECT_URL): "
if kc exec "$LEGIT_POD" -- curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$DIRECT_URL" | grep -q "200"; then
    echo "OK"
else
    warn "UNREACHABLE — is the gateway running the loadtest image with /test/heavy?"; exit 1
fi

echo -n "  Proxy endpoint  ($PROXY_URL): "
if kc exec "$LEGIT_POD" -- curl -sk -H "Host: $VHOST" -o /dev/null -w "%{http_code}" --max-time 5 "$PROXY_URL" | grep -q "200"; then
    echo "OK"
else
    warn "UNREACHABLE — is nginx-extension up and serving server_name $VHOST?"; exit 1
fi

# ─── TEST 1: DIRECT (NO PROXY) ──────────────────────────────────────────────
log "TEST 1 — DIRECT (no proxy protection)"
echo "  Attacker floods $DIRECT_URL for $DURATION with $CONCURRENCY connections"
echo "  Legit user also hits the gateway directly (same path, no protection)"

hey_in_pod -z "$DURATION" -c "$CONCURRENCY" "$DIRECT_URL" > "$RESULTS_DIR/hey-direct.txt" 2>&1 &
HEY_PID=$!
run_legit_user "$DIRECT_URL" "$RESULTS_DIR/legit-direct.csv" &
LEGIT_PID=$!
wait "$HEY_PID" 2>/dev/null || true
wait "$LEGIT_PID" 2>/dev/null || true
log "Test 1 complete."

# ─── COOLDOWN ────────────────────────────────────────────────────────────────
log "Cooldown — restarting gateway to ensure a clean state..."
kc rollout restart "deploy/$GW_DEPLOY"
kc rollout status "deploy/$GW_DEPLOY" --timeout=120s
sleep 5

# ─── TEST 2: THROUGH NGINX ──────────────────────────────────────────────────
log "TEST 2 — THROUGH NGINX (per-IP rate limiting)"
echo "  Attacker floods $PROXY_URL for $DURATION with $CONCURRENCY connections"
echo "  Legit user hits nginx from a DIFFERENT pod IP ($LEGIT_POD)"

hey_in_pod -z "$DURATION" -c "$CONCURRENCY" -disable-keepalive -host "$VHOST" "$PROXY_URL" \
    > "$RESULTS_DIR/hey-proxy.txt" 2>&1 &
HEY_PID=$!
run_legit_user "$PROXY_URL" "$RESULTS_DIR/legit-proxy.csv" "$VHOST" &
LEGIT_PID=$!
wait "$HEY_PID" 2>/dev/null || true
wait "$LEGIT_PID" 2>/dev/null || true
log "Test 2 complete."

# ─── RESULTS SUMMARY ─────────────────────────────────────────────────────────
echo ""
echo "=================================================================="
echo "                        RESULTS SUMMARY"
echo "=================================================================="

log "TEST 1 — DIRECT (no proxy)"
echo "--- Attacker flood results ---"
grep -E "^(  Total:|  Slowest:|  Fastest:|  Average:|  Requests/sec:)" "$RESULTS_DIR/hey-direct.txt" || true
sed -n '/Status code distribution/,/^$/p' "$RESULTS_DIR/hey-direct.txt" || true
echo ""
echo "--- Legitimate user experience during attack ---"
print_legit_summary "$RESULTS_DIR/legit-direct.csv"

log "TEST 2 — THROUGH NGINX (rate limiting)"
echo "--- Attacker flood results ---"
grep -E "^(  Total:|  Slowest:|  Fastest:|  Average:|  Requests/sec:)" "$RESULTS_DIR/hey-proxy.txt" || true
sed -n '/Status code distribution/,/^$/p' "$RESULTS_DIR/hey-proxy.txt" || true
echo ""
echo "--- Legitimate user experience during attack ---"
print_legit_summary "$RESULTS_DIR/legit-proxy.csv"

echo ""
echo "=================================================================="
echo "KEY COMPARISON:"
DIRECT_OK=$(tail -n +2 "$RESULTS_DIR/legit-direct.csv" | awk -F',' '$2 == 200' | wc -l | tr -d ' ')
DIRECT_TOTAL=$(tail -n +2 "$RESULTS_DIR/legit-direct.csv" | wc -l | tr -d ' ')
DIRECT_AVG=$(tail -n +2 "$RESULTS_DIR/legit-direct.csv" | awk -F',' '{sum+=$3; n++} END {if(n>0) printf "%.3f", sum/n; else print "N/A"}')
PROXY_OK=$(tail -n +2 "$RESULTS_DIR/legit-proxy.csv" | awk -F',' '$2 == 200' | wc -l | tr -d ' ')
PROXY_TOTAL=$(tail -n +2 "$RESULTS_DIR/legit-proxy.csv" | wc -l | tr -d ' ')
PROXY_AVG=$(tail -n +2 "$RESULTS_DIR/legit-proxy.csv" | awk -F',' '{sum+=$3; n++} END {if(n>0) printf "%.3f", sum/n; else print "N/A"}')
ATTACKER_DIRECT=$(grep '\[200\]' "$RESULTS_DIR/hey-direct.txt" | awk '{print $2}' || echo "0")
ATTACKER_PROXY_OK=$(grep '\[200\]' "$RESULTS_DIR/hey-proxy.txt" | awk '{print $2}' || echo "0")
ATTACKER_PROXY_BLOCKED=$(grep '\[429\]' "$RESULTS_DIR/hey-proxy.txt" | awk '{print $2}' || echo "0")
echo ""
echo "  WITHOUT PROXY:"
echo "    Attacker:    reached backend (${ATTACKER_DIRECT:-0} got 200)"
echo "    Legit user:  $DIRECT_OK/$DIRECT_TOTAL successful, avg ${DIRECT_AVG}s"
echo ""
echo "  WITH PROXY:"
echo "    Attacker:    ${ATTACKER_PROXY_BLOCKED:-0} rejected (429), only ${ATTACKER_PROXY_OK:-0} got through"
echo "    Legit user:  $PROXY_OK/$PROXY_TOTAL successful, avg ${PROXY_AVG}s"
echo "=================================================================="
log "Full output saved in: $RESULTS_DIR/"
echo "  - hey-direct.txt / hey-proxy.txt    (attacker flood stats)"
echo "  - legit-direct.csv / legit-proxy.csv (legit user samples)"
echo "=================================================================="
