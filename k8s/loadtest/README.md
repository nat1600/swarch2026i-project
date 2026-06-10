# Load test — nginx per-IP rate limiting (k8s)

This is the Kubernetes port of the docker-compose DDoS test from
`prototype_3/feat/reverse-proxy` (`test-ddos.sh`). It demonstrates **Security
Scenario 3** from the root `README.md`: nginx rate-limiting at the reverse proxy
keeps the gateway available for legitimate users during a flood.

## The one idea that makes this work: source IP

The nginx limit keys on `$binary_remote_addr` (per client IP). The test is only
valid if nginx sees the attacker and the legit user as **different** IPs.

In docker-compose that was free: the attacker was the host, the legit user was a
container — two different docker-network IPs. In Kubernetes, flooding from
outside the cluster destroys that property:

- **NodePort, default `externalTrafficPolicy: Cluster`** → kube-proxy may hop
  the packet to a pod on another node, so it **source-NATs the client IP to the
  node IP**. Every external client collapses to one IP → one rate-limit bucket.
- **Cloudflare tunnel** → `cloudflared` opens its own localhost connection to
  nginx, so nginx sees `127.0.0.1` for everyone. The real IP survives only in a
  header (`CF-Connecting-IP`), which `$binary_remote_addr` does not read.

Either way, two different real users would share one bucket and throttle each
other. (Production fix: nginx `real_ip` module trusting `CF-Connecting-IP` from
known proxies only.)

So we test **from inside the cluster**: the attacker and legit user are two
pods. Pod → ClusterIP traffic is not SNAT'd, so nginx sees two real, distinct
pod IPs — exactly the host-vs-container distinction the compose test relied on.

## Files

| File | Purpose |
|---|---|
| `loadtest-pods.yaml` | Attacker pod (`hey`) + legit pod (`curl`), each its own IP |
| `setup.sh` | Reconfigure gateway + nginx for the test, create the pods |
| `test-ddos-k8s.sh` | Two-phase test (direct vs. proxied) + summary |
| `teardown.sh` | Revert everything, delete the pods |

## Prerequisites

1. A working cluster + `kubectl` pointed at it (the k3s/Tailscale deploy from
   `DEPLOY.md`), with the stack already deployed.
2. `kustomize` standalone installed (used by `scripts/apply-nginx.sh`).
3. **Build + push the loadtest gateway image** — the production image
   (`:v1.0.0`) has no `/test/heavy` handler. From the repo root:

   ```bash
   cd api-gateway
   docker buildx build --platform linux/amd64,linux/arm64 \
     -t vmoras/api-gateway-container:v1.0.1-ddos --push .
   cd ..
   ```

   (If you use a different tag, pass it: `IMAGE=you/img:tag bash k8s/loadtest/setup.sh`.)

## Run

```bash
bash k8s/loadtest/setup.sh          # gateway -> 1 replica + limits + loadtest image
bash k8s/loadtest/test-ddos-k8s.sh  # runs the two phases, prints the comparison
bash k8s/loadtest/teardown.sh       # restores prod config, deletes pods
```

Results (raw `hey` output + per-sample CSVs) land in `./ddos-test-results/`,
which is already gitignored.

### What setup.sh changes (and why)

- **gateway → 1 replica, `200m` CPU / `64Mi` memory.** Mirrors the compose
  `0.2 CPU / 64M` limit and forces the flood onto a single constrained pod, so
  the "no protection" half can actually exhaust it.
- **nginx-extension → 1 replica.** `limit_req` state lives in each nginx pod's
  own shared-memory zone. With 2 replicas the attacker's traffic splits across
  two independent buckets and the effective per-IP budget doubles.

All of this is reverted by `teardown.sh` (gateway restored from
`k8s/services/api-gateway.yaml`, nginx back to 2 replicas).

## Expected result

| | Attacker | Legit user |
|---|---|---|
| **Direct (no proxy)** | all requests reach the backend | mostly fails — gateway is saturated |
| **Through nginx** | ~all rejected with **429** | ~100% success, fast — different pod IP, untouched bucket |

## Caveats

- **Probes flap under the direct flood.** With the CPU limit saturated, the
  gateway's readiness/liveness probes can fail mid-test (pod pulled from
  endpoints, or restarted). That is partly the point (it's falling over with no
  protection), but if you want cleaner Test-1 numbers, temporarily comment out
  the liveness probe in `k8s/services/api-gateway.yaml` before `setup.sh`.
- **`/test/heavy` stays in the source** (gateway handler + nginx location) on
  this branch. It's inert on the production image — that image has no
  `/test/heavy` handler, so the nginx location just proxies to a cheap 404.
  Don't merge the loadtest image tag into production.
- **Host header matters.** From a pod you reach nginx at
  `https://nginx-extension-service/...`, whose default Host header does **not**
  match `server_name` → nginx returns `444`. The script always sends
  `Host: api.parla.bar` (curl `-H`, hey `-host`); keep that if you edit it.
