# Rate-limit test over the VPN (two machines)

This is the same nginx rate-limit demonstration we ran with docker-compose, but
adapted to the k3s deploy. In docker-compose the "two different clients" were
the **host** (attacker) and a **container** (legit user) — two different IPs on
the docker network. Here the two clients are **two real machines on the
Tailnet**:

- **Machine A** — the k3s node. Runs the single nginx replica + the gateway.
- **Machine B** — any other machine on the VPN (does **not** run k3s).

The attacker floods nginx from one machine; the legit user hits it from the
other; we confirm the attacker is throttled with `429`s while the legit user
keeps getting `200`s.

```
   Machine B (Tailnet)                 Machine A (k3s node)
   ┌────────────────┐                  ┌──────────────────────────────┐
   │  attacker: hey │ ──VPN──▶ :30444  │  nginx-extension (1 replica) │
   └────────────────┘   NodePort       │      │ limit_req 10r/s        │
                                        │      ▼                        │
   ┌────────────────┐                  │  api-gateway → /test/heavy    │
   │ legit: curl    │ ──VPN──▶ :30444  │  (loadtest image, 1 replica,  │
   │ (run on A)     │   NodePort        │   200m CPU / 64Mi)            │
   └────────────────┘                  └──────────────────────────────┘
```

---

## Prerequisites

**On the cluster (Machine A):** prepare the gateway + nginx exactly as for the
in-cluster test — the loadtest gateway image with `/test/heavy`, 1 gateway
replica with `200m`/`64Mi` limits, the rate-limited `/test/heavy` nginx
location, and nginx scaled to 1 replica. `setup.sh` already does all of this:

```bash
# on Machine A, from the repo root
bash k8s/loadtest/setup.sh
```

(You can ignore the `loadtest-attacker`/`loadtest-legit` pods it creates — this
VPN test drives the clients from the machines instead.)

**On Machine B:** install the load generator and curl.

```bash
# hey (attacker tool)
go install github.com/rakyll/hey@latest        # or download the prebuilt binary
# curl is preinstalled on almost everything
```

**Find Machine A's Tailscale IP** (run on Machine A):

```bash
tailscale ip -4        # e.g. 100.118.36.69
```

---

## ⚠️ One required toggle: `externalTrafficPolicy: Local`

For the legit user to behave like the docker-compose container (a **different
IP**, not throttled by the attacker), nginx has to *see* the two machines as two
different IPs. On a NodePort that depends on one Service setting:

```bash
# on Machine A
kubectl patch svc nginx-extension-service \
  -p '{"spec":{"externalTrafficPolicy":"Local"}}'
```

> With the default `Cluster` policy, the NodePort source-NATs every external
> client to the node's own IP, so Machine A and Machine B collapse into **one**
> rate-limit bucket and the legit user gets throttled too. `Local` preserves the
> real client IP. **Why this happens — and the separate Cloudflare-tunnel case —
> is the IP discussion we'll have next; for now just set `Local` so the test
> reproduces the docker-compose behavior.**

This needs the nginx pod to be on the node you target. Machine A runs the single
replica, so always aim both clients at **Machine A's** Tailscale IP.

---

## Run the test

Set the node IP once on each machine:

```bash
NODE=100.118.36.69     # Machine A's Tailscale IP
```

**Preflight from Machine B** — expect `200`:

```bash
curl -sk -H "Host: api.parla.bar" -o /dev/null -w "%{http_code}\n" \
  --max-time 5 https://$NODE:30444/test/heavy
```

> The `-H "Host: api.parla.bar"` is **mandatory**: the URL host is a bare IP,
> which doesn't match nginx's `server_name localhost api.parla.bar`, so without
> it nginx returns `444`. `-k` accepts the self-signed cert.

Now run all three at once:

**Terminal 1 — attacker flood (Machine B):**
```bash
hey -z 30s -c 200 -disable-keepalive -host api.parla.bar \
  https://$NODE:30444/test/heavy
```
(`hey` skips TLS verification by default, so the self-signed cert is fine; `-host`
sets the Host header.)

**Terminal 2 — legit user (Machine A):**
```bash
NODE=100.118.36.69
while true; do
  curl -sk -H "Host: api.parla.bar" -o /dev/null -w "%{http_code} %{time_total}s\n" \
    --max-time 5 https://$NODE:30444/test/heavy
  sleep 2
done
```

**Terminal 3 — watch nginx (Machine A):**
```bash
kubectl logs -f -l app=nginx-extension
```
The first field of each log line is the client IP nginx saw. With `Local` set,
you'll see Machine B's real Tailscale IP and Machine A's IP as **two distinct
addresses**; the attacker's address racks up `429`s while the legit one stays
`200`.

---

## Expected result

| | Attacker (Machine B) | Legit user (Machine A) |
|---|---|---|
| HTTP status | mostly **429** (Too Many Requests) | **200** |
| `hey` "Status code distribution" | large `[429]` count, small `[200]` | — |
| Experience | throttled to ~10 r/s | unaffected, fast |

In `hey`'s output, check the **Status code distribution** block — the bulk of the
requests should be `[429]`, proving nginx capped the attacker at the configured
`10r/s` while the legit user (different IP) sailed through.

---

## Teardown

```bash
# revert the Service policy
kubectl patch svc nginx-extension-service \
  -p '{"spec":{"externalTrafficPolicy":"Cluster"}}'

# restore gateway/nginx to production config and remove the test pods
bash k8s/loadtest/teardown.sh
```

---

## Gotchas

- **`444` responses** → missing/incorrect `Host: api.parla.bar` header.
- **`429` for the legit user too** → you're on `externalTrafficPolicy: Cluster`
  (SNAT merged both IPs). Set `Local`.
- **Connection refused / hangs from Machine B** → you targeted a node that
  doesn't run the nginx pod; aim at Machine A's IP. Also confirm the NodePort is
  reachable over the VPN (`nc -vz $NODE 30444`).
- **TLS errors** → use `-k` (curl); `hey` already skips verification.

---

## Next

Once the test runs, the open question is how to make nginx see the **real**
client IPs in production, where this VPN/NodePort path is replaced by the
Cloudflare tunnel. That's two separate fixes — **SNAT** (`externalTrafficPolicy`)
for direct NodePort access, and **`real_ip` + `CF-Connecting-IP`** for tunnelled
traffic — covered separately.
