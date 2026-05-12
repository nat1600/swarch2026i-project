# Laboratory 5 — Reverse Proxy Pattern

**Team:** 2A  
**Members:** Mateo Andrés Vivas  
**Project:** Parla — Language Learning Through Series & Movies

---

## 1. Pattern Description

A **Reverse Proxy** sits between external clients and internal services. Clients communicate only with the proxy; they have no knowledge of — and no direct route to — the internal services behind it.

Its security responsibilities include:

- **TLS termination:** encrypts the client-facing channel; internal traffic stays on a private network.
- **Request filtering:** strips or rewrites malicious/internal headers before they reach backend services.
- **Rate limiting:** blocks volumetric attacks at the network edge, before they consume application resources.
- **Identity concealment:** hides server software versions and internal hostnames.

---

## 2. Quality Scenario

| Attribute | Detail |
|---|---|
| **Quality attribute** | Security — Confidentiality & Availability |
| **Source** | External attacker / anonymous internet client |
| **Stimulus** | Attempts to reach a microservice directly, inject internal headers, or flood the API with requests |
| **Artifact** | Parla platform network boundary |
| **Environment** | Normal operation (production-equivalent Docker network) |
| **Response** | Nginx intercepts all traffic; microservices are unreachable from outside; malicious headers are stripped; excess requests receive HTTP 429 |
| **Response measure** | 0 microservices exposed on host ports; security headers present on 100% of responses; >10 req/s per IP blocked automatically |

---

## 3. Architecture

### Before (without reverse proxy)

```
Internet
  │
  ├──► :8080  api-gateway  ──► auth-service
  │                        ──► core-service
  │                        ──► forum-service
  │                        ──► payment-service
  └──► :3000  web-app
```

Every service inside Docker was reachable if someone mapped or exposed its port. The api-gateway itself was directly accessible on the host.

### After (with Nginx reverse proxy)

```
Internet
  │
  ├──► :443  nginx (TLS termination, security headers, rate limit)
  │            │
  │            └──► api-gateway (internal only, no host port)
  │                    ├──► auth-service
  │                    ├──► core-service
  │                    ├──► forum-service
  │                    └──► payment-service
  │
  └──► :80   nginx (redirects to HTTPS)
```

Nginx is the **only** container with ports exposed to the host. The api-gateway and all microservices are reachable only within the Docker internal network.

---

## 4. Implementation Steps

### Step 1 — Create the Nginx configuration

Create `nginx/nginx.conf`:

```nginx
worker_processes auto;

events { worker_connections 1024; }

http {
    server_tokens off;  # hide Nginx version

    # Rate limit: 10 req/s per IP, burst of 20
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # HTTP → HTTPS redirect
    server {
        listen 80;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;

        ssl_certificate     /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options            "DENY"    always;
        add_header X-Content-Type-Options     "nosniff" always;
        add_header X-XSS-Protection           "1; mode=block" always;
        add_header Referrer-Policy            "strict-origin-when-cross-origin" always;

        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;

        location / {
            proxy_pass       http://api-gateway:8080;
            proxy_set_header Host              $host;
            proxy_set_header X-Real-IP         $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Internal-Secret "";  # strip injected headers
        }
    }
}
```

### Step 2 — Generate a self-signed TLS certificate

```bash
chmod +x nginx/generate-certs.sh
bash nginx/generate-certs.sh
```

This creates `nginx/certs/cert.pem` and `nginx/certs/key.pem` using OpenSSL (no extra tools required). These files are gitignored — each developer runs the script once.

Add to `.gitignore`:
```
nginx/certs/*.pem
```

### Step 3 — Update docker-compose.yml

Add the Nginx service and **remove** the host port from the api-gateway:

```yaml
nginx:
  image: nginx:alpine
  container_name: nginx
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/certs:/etc/nginx/certs:ro
  depends_on:
    - api-gateway

api-gateway:
  build: ./api-gateway
  container_name: api-gateway
  # No ports: key — only reachable by Nginx inside the Docker network
  env_file:
    - ./api-gateway/.env
```

Point the web-app server-side URLs to Nginx:

```yaml
environment:
  SERVER_AUTH_URL: https://nginx/api/auth
  SERVER_CORE_URL: https://nginx/api/core
  # ... etc
```

### Step 4 — Start the stack

```bash
docker compose up --build
```

The application is now accessible at `https://localhost`. HTTP requests to `http://localhost` are automatically redirected to HTTPS.

---

## 5. Results

| Check | Result |
|---|---|
| api-gateway accessible from host on :8080 | No — port removed |
| HTTPS enforced | Yes — HTTP redirects to HTTPS |
| Security headers on every response | Yes — verified with `curl -I https://localhost` |
| Rate limiting active | Yes — >10 req/s per IP returns HTTP 429 |
| Server version hidden | Yes — `Server:` header omitted |

Verify with:

```bash
# Check security headers
curl -k -I https://localhost

# Confirm api-gateway is NOT reachable directly
curl http://localhost:8080   # should fail / connection refused

# Test rate limiting (sends 30 requests fast)
for i in $(seq 1 30); do curl -k -o /dev/null -s -w "%{http_code}\n" https://localhost/api/auth/health; done
```

---

## 6. Recommendations for Other Teams

1. **Generate certs before `docker compose up`** — Nginx fails to start if `cert.pem` / `key.pem` are missing. Add this to your project's setup documentation.

2. **Never expose internal service ports in docker-compose** — The security benefit of a reverse proxy is nullified if microservices also have `ports:` mappings. Remove all `ports:` from internal services.

3. **Keep `server_tokens off`** — By default Nginx advertises its version, which aids attackers. Always disable it in production.

4. **Rate limit at the proxy, not only the app** — The api-gateway already has rate limiting in Go, but applying it at the Nginx layer catches attacks before they consume any application thread.

5. **For production, use a CA-signed cert** — Replace the self-signed cert with Let's Encrypt (via `certbot` or the `nginx-certbot` Docker image). The `nginx.conf` structure stays identical; only the cert paths change.
