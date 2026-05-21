#!/usr/bin/env bash
set -euo pipefail

# ─── CONFIG ──────────────────────────────────────────────────────────────────
DIRECT_URL="http://localhost:9090/test/heavy"       # No proxy (gateway exposed)
PROXY_URL="https://localhost:8443/test/heavy"        # Through nginx
LEGIT_CONTAINER="legit-user"                         # Container with different IP
LEGIT_INTERNAL_URL="https://nginx-extension/test/heavy"  # URL from inside docker network
DURATION="30s"
CONCURRENCY=200
LEGIT_INTERVAL=2                                     # seconds between legitimate requests
RESULTS_DIR="./ddos-test-results"

mkdir -p "$RESULTS_DIR"

# ─── HELPERS ─────────────────────────────────────────────────────────────────
log()  { echo -e "\n\033[1;36m>>> $1\033[0m"; }
warn() { echo -e "\033[1;33m    $1\033[0m"; }

# Legitimate user from HOST (same IP as attacker)
run_legit_user_host() {
    local url="$1" out="$2"
    echo "timestamp,status,time_total" > "$out"
    while kill -0 "$HEY_PID" 2>/dev/null; do
        local ts result
        ts=$(date +%H:%M:%S)
        result=$(curl -sk -o /dev/null -w "%{http_code},%{time_total}" --max-time 5 "$url" 2>/dev/null || echo "000,0.000")
        echo "${ts},${result}" >> "$out"
        sleep "$LEGIT_INTERVAL"
    done
}

# Legitimate user from CONTAINER (different IP than attacker)
run_legit_user_container() {
    local out="$1"
    echo "timestamp,status,time_total" > "$out"
    while kill -0 "$HEY_PID" 2>/dev/null; do
        local ts result
        ts=$(date +%H:%M:%S)
        result=$(docker exec "$LEGIT_CONTAINER" \
            curl -sk -o /dev/null -w "%{http_code},%{time_total}" --max-time 5 \
            "$LEGIT_INTERNAL_URL" 2>/dev/null || echo "000,0.000")
        echo "${ts},${result}" >> "$out"
        sleep "$LEGIT_INTERVAL"
    done
}

print_legit_summary() {
    local file="$1"
    local total ok slow timeout avg_time
    total=$(tail -n +2 "$file" | wc -l)
    ok=$(tail -n +2 "$file" | awk -F',' '$2 == 200' | wc -l)
    slow=$(tail -n +2 "$file" | awk -F',' '$2 == 200 && $3 > 0.5' | wc -l)
    timeout=$(tail -n +2 "$file" | awk -F',' '$2 == 0 || $2 == "000"' | wc -l)
    avg_time=$(tail -n +2 "$file" | awk -F',' '{sum+=$3; n++} END {if(n>0) printf "%.3f", sum/n; else print "N/A"}')

    echo "  Samples:          $total"
    echo "  Successful (200): $ok / $total"
    echo "  Slow (>500ms):    $slow"
    echo "  Timeouts/errors:  $timeout"
    echo "  Avg response:     ${avg_time}s"
}

# ─── PRE-FLIGHT CHECKS ──────────────────────────────────────────────────────
log "Pre-flight checks"

if ! command -v hey &>/dev/null; then
    echo "ERROR: 'hey' not found. Install it: go install github.com/rakyll/hey@latest"
    exit 1
fi

echo -n "  Direct endpoint ($DIRECT_URL): "
if curl -s -o /dev/null -w "%{http_code}" "$DIRECT_URL" | grep -q "200"; then
    echo "OK"
else
    warn "UNREACHABLE — make sure api-gateway exposes port 9090"
    exit 1
fi

echo -n "  Proxy endpoint  ($PROXY_URL):  "
if curl -sk -o /dev/null -w "%{http_code}" "$PROXY_URL" | grep -q "200"; then
    echo "OK"
else
    warn "UNREACHABLE — make sure nginx-extension is running"
    exit 1
fi

echo -n "  Legit user container ($LEGIT_CONTAINER): "
if docker exec "$LEGIT_CONTAINER" curl -sk -o /dev/null -w "%{http_code}" "$LEGIT_INTERNAL_URL" 2>/dev/null | grep -q "200"; then
    echo "OK"
else
    warn "UNREACHABLE — make sure '$LEGIT_CONTAINER' container is running"
    exit 1
fi

# ─── TEST 1: DIRECT (NO PROXY) ──────────────────────────────────────────────
log "TEST 1 — DIRECT (no proxy protection)"
log "Attacker floods $DIRECT_URL for $DURATION with $CONCURRENCY connections"
log "Legitimate user also hits $DIRECT_URL (same path, no protection)"

hey -z "$DURATION" -c "$CONCURRENCY" "$DIRECT_URL" > "$RESULTS_DIR/hey-direct.txt" 2>&1 &
HEY_PID=$!

run_legit_user_host "$DIRECT_URL" "$RESULTS_DIR/legit-direct.csv" &
LEGIT_PID=$!

wait "$HEY_PID" 2>/dev/null || true
wait "$LEGIT_PID" 2>/dev/null || true

log "Test 1 complete."

# ─── COOLDOWN ────────────────────────────────────────────────────────────────
log "Cooldown — restarting api-gateway to ensure clean state..."
docker compose restart api-gateway
sleep 15

# ─── TEST 2: THROUGH NGINX ──────────────────────────────────────────────────
log "TEST 2 — THROUGH NGINX (with rate limiting)"
log "Attacker floods $PROXY_URL for $DURATION with $CONCURRENCY connections"
log "Legitimate user hits nginx from DIFFERENT IP (container: $LEGIT_CONTAINER)"

hey -z "$DURATION" -c "$CONCURRENCY" -disable-keepalive "$PROXY_URL" > "$RESULTS_DIR/hey-proxy.txt" 2>&1 &
HEY_PID=$!

run_legit_user_container "$RESULTS_DIR/legit-proxy.csv" &
LEGIT_PID=$!

wait "$HEY_PID" 2>/dev/null || true
wait "$LEGIT_PID" 2>/dev/null || true

log "Test 2 complete."

# ─── RESULTS SUMMARY ────────────────────────────────────────────────────────
echo ""
echo "=================================================================="
echo "                        RESULTS SUMMARY"
echo "=================================================================="

log "TEST 1 — DIRECT (no proxy)"
echo "  Attacker:  floods gateway directly"
echo "  Legit user: also hits gateway directly (no protection)"
echo ""
echo "--- Attacker flood results ---"
grep -E "^(  Total:|  Slowest:|  Fastest:|  Average:|  Requests/sec:|Status code distribution)" \
    "$RESULTS_DIR/hey-direct.txt" || true
sed -n '/Status code distribution/,/^$/p' "$RESULTS_DIR/hey-direct.txt" || true
echo ""
echo "--- Legitimate user experience during attack ---"
print_legit_summary "$RESULTS_DIR/legit-direct.csv"

log "TEST 2 — THROUGH NGINX (rate limiting)"
echo "  Attacker:  floods through nginx (from host)"
echo "  Legit user: hits nginx from different IP (from container)"
echo ""
echo "--- Attacker flood results ---"
grep -E "^(  Total:|  Slowest:|  Fastest:|  Average:|  Requests/sec:|Status code distribution)" \
    "$RESULTS_DIR/hey-proxy.txt" || true
sed -n '/Status code distribution/,/^$/p' "$RESULTS_DIR/hey-proxy.txt" || true
echo ""
echo "--- Legitimate user experience during attack ---"
print_legit_summary "$RESULTS_DIR/legit-proxy.csv"

echo ""
echo "=================================================================="
echo ""
echo "KEY COMPARISON:"
echo ""
DIRECT_OK=$(tail -n +2 "$RESULTS_DIR/legit-direct.csv" | awk -F',' '$2 == 200' | wc -l)
DIRECT_TOTAL=$(tail -n +2 "$RESULTS_DIR/legit-direct.csv" | wc -l)
DIRECT_AVG=$(tail -n +2 "$RESULTS_DIR/legit-direct.csv" | awk -F',' '{sum+=$3; n++} END {if(n>0) printf "%.3f", sum/n; else print "N/A"}')
PROXY_OK=$(tail -n +2 "$RESULTS_DIR/legit-proxy.csv" | awk -F',' '$2 == 200' | wc -l)
PROXY_TOTAL=$(tail -n +2 "$RESULTS_DIR/legit-proxy.csv" | wc -l)
PROXY_AVG=$(tail -n +2 "$RESULTS_DIR/legit-proxy.csv" | awk -F',' '{sum+=$3; n++} END {if(n>0) printf "%.3f", sum/n; else print "N/A"}')
ATTACKER_DIRECT=$(grep '\[200\]' "$RESULTS_DIR/hey-direct.txt" | awk '{print $2}' || echo "0")
ATTACKER_PROXY_OK=$(grep '\[200\]' "$RESULTS_DIR/hey-proxy.txt" | awk '{print $2}' || echo "0")
ATTACKER_PROXY_BLOCKED=$(grep '\[429\]' "$RESULTS_DIR/hey-proxy.txt" | awk '{print $2}' || echo "0")

echo "  WITHOUT PROXY:"
echo "    Attacker:    all requests reached backend ($ATTACKER_DIRECT got 200)"
echo "    Legit user:  $DIRECT_OK/$DIRECT_TOTAL successful, avg ${DIRECT_AVG}s"
echo ""
echo "  WITH PROXY:"
echo "    Attacker:    $ATTACKER_PROXY_BLOCKED rejected (429), only $ATTACKER_PROXY_OK got through"
echo "    Legit user:  $PROXY_OK/$PROXY_TOTAL successful, avg ${PROXY_AVG}s"
echo ""
echo "=================================================================="
log "Full output saved in: $RESULTS_DIR/"
echo "  - hey-direct.txt       (flood stats without proxy)"
echo "  - hey-proxy.txt        (flood stats with proxy)"
echo "  - legit-direct.csv     (legitimate user samples without proxy)"
echo "  - legit-proxy.csv      (legitimate user samples with proxy)"
echo "=================================================================="