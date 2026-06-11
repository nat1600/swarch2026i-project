# Deployment Guide

Guía paso a paso para deployar Parla desde cero en un cluster Kubernetes con servicios managed (Neon, Atlas, Upstash, CloudAMQP) y un dominio público vía Cloudflare Tunnel.

> Si solo quieres correr el proyecto localmente para desarrollo, usa `docker-compose up` desde la raíz. Esta guía es para el deploy en cluster real.

---

## Tabla de contenido

1. [Arquitectura](#arquitectura)
2. [Prerrequisitos](#prerrequisitos)
3. [Servicios externos (managed)](#servicios-externos-managed)
4. [Auth0](#auth0)
5. [Dominio + Cloudflare](#dominio--cloudflare)
6. [Cluster k3s](#cluster-k3s)
7. [Build de imágenes](#build-de-im%C3%A1genes)
8. [Configurar Secrets locales](#configurar-secrets-locales)
9. [Deploy paso a paso](#deploy-paso-a-paso)
10. [Cloudflare Tunnel](#cloudflare-tunnel)
11. [Browser extension](#browser-extension)
12. [Verificación](#verificaci%C3%B3n)
13. [Troubleshooting](#troubleshooting)

---

## Arquitectura

```
                          INTERNET
                              │
                              ▼
                    ┌──────────────────┐
                    │   Cloudflare     │
                    │  (TLS edge,      │
                    │   DDoS, cache)   │
                    └──────────────────┘
                              │  (tunnel encriptado)
                              ▼
                    ┌──────────────────┐
                    │   cloudflared    │ ← corre en el PC del cluster
                    │   (en el host)   │
                    └──────────────────┘
                              │  localhost:30443 / 30444
                              ▼
       ┌──────────────────────────────────────────────┐
       │   k8s cluster (k3s, multi-node)              │
       │                                              │
       │   ┌────────────────┐    ┌────────────────┐   │
       │   │ nginx-web-app  │    │ nginx-extension│   │
       │   │ NodePort       │    │ NodePort       │   │
       │   │ 30080/30443    │    │ 30081/30444    │   │
       │   └────────┬───────┘    └────────┬───────┘   │
       │            │                     │           │
       │            ▼                     ▼           │
       │   ┌────────────────┐    ┌────────────────┐   │
       │   │   web-app      │    │  api-gateway   │   │
       │   │  (Next.js)     │    │     (Go)       │   │
       │   └────────┬───────┘    └────────┬───────┘   │
       │            │  /api/* via api-gateway          │
       │            └─────┐         ┌─────┘           │
       │                  ▼         ▼                 │
       │   ┌──────────────────────────────────────┐   │
       │   │  auth-service, core-service,         │   │
       │   │  forum-service, gamification-service │   │
       │   │  payment-service, enrichment-service │   │
       │   └────────────────┬─────────────────────┘   │
       └────────────────────┼─────────────────────────┘
                            │
                ┌───────────┴────────────┐
                ▼            ▼           ▼
            ┌───────┐   ┌───────┐   ┌──────────┐
            │ Neon  │   │ Atlas │   │ Upstash  │
            │(Postgres)│ (Mongo)│   │ (Redis)  │
            └───────┘   └───────┘   └──────────┘
                            │
                            ▼
                       ┌───────────┐
                       │CloudAMQP  │
                       │(RabbitMQ) │
                       └───────────┘
```

**Componentes en el cluster:**
- 2 nginx (web-app + extension) — reverse proxies con rate limiting y headers de seguridad
- 1 api-gateway (Go) — enruta `/api/*` a los microservicios
- 6 microservicios (auth, core, forum, gamification, payment, enrichment)
- 1 web-app (Next.js)

**Fuera del cluster (managed):**
- Postgres en Neon
- MongoDB en Atlas
- Redis en Upstash
- RabbitMQ en CloudAMQP

---

## Prerrequisitos

Instala estas herramientas en tu máquina dev:

| Tool | Para qué | Cómo |
|---|---|---|
| `kubectl` | Manejar el cluster | Viene con k3s como symlink. Si quieres standalone: `sudo snap install kubectl --classic` |
| `kustomize` | Generar manifests con ConfigMaps de archivos externos | `curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" \| bash && sudo mv kustomize /usr/local/bin/` |
| `docker` + `buildx` | Build de imágenes multi-arch | `apt install docker.io docker-buildx-plugin` |
| `cloudflared` | Tunnel a Cloudflare | `curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb` |
| `uv` | Para correr migrations Python (Alembic) | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

Cuenta en **Docker Hub** (o cualquier registry) para pushear las imágenes.

---

## Servicios externos (managed)

### Postgres — Neon

1. Crea cuenta en [neon.tech](https://neon.tech)
2. Crea **4 proyectos** (uno por servicio que usa Postgres):
   - `auth_db`
   - `core_db`
   - `payment_db`
   - `gamification_db`
3. Para cada proyecto, en el dashboard saca el "Connection string". Vas a necesitar:
   - `POSTGRES_HOST` (ej: `ep-cool-name.us-east-2.aws.neon.tech`)
   - `POSTGRES_PORT` (5432)
   - `POSTGRES_USER` (default: `neondb_owner`)
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB` (nombre que le diste arriba)

> **Importante:** Neon usa **pooler** endpoints. Si vas a tener varios pods o réplicas, usa el endpoint con `-pooler.` en el hostname (el dashboard te lo muestra). Sino te quedas sin conexiones rápido en el free tier.

### MongoDB — Atlas

1. Crea cuenta en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratis (M0)
3. **Network Access** → agrega `0.0.0.0/0` (sino, Atlas bloquea conexiones del cluster)
4. **Database Access** → crea un usuario con password
5. Saca la connection string: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`

Vas a necesitar dos DBs: `core_db` y `forum_db`. No las tienes que crear manualmente — el código las crea on demand.

### Redis — Upstash

1. Cuenta en [upstash.com](https://upstash.com)
2. Create database (free tier)
3. Del dashboard saca:
   - `REDIS_HOST` (ej: `nearby-wolf-40681.upstash.io`) — **solo el host, sin `redis://` ni password**
   - `REDIS_PORT` (6379)
   - `REDIS_PASSWORD` (la cadena después de `default:` en el endpoint)
4. Upstash **exige TLS** → tu config debe tener `REDIS_SSL=true`

### RabbitMQ — CloudAMQP

1. Cuenta en [cloudamqp.com](https://cloudamqp.com)
2. Create instance → plan "Little Lemur" (free)
3. Saca la **AMQP URL** (con `amqps://`, no `amqp://`):
   ```
   amqps://user:pass@gerbil.rmq.cloudamqp.com/vhost-name
   ```

---

## Auth0

1. Cuenta en [auth0.com](https://auth0.com)
2. Create **Application** → "Regular Web Application"
3. En **Settings**:
   - Anota `Domain`, `Client ID`, `Client Secret`
4. En **URLs**:
   - **Allowed Callback URLs**: `https://TU-DOMINIO/auth/callback`
   - **Allowed Logout URLs**: `https://TU-DOMINIO`
   - **Allowed Web Origins**: `https://TU-DOMINIO`
5. En **APIs** → Create API:
   - Identifier: `https://parla.com` (o lo que quieras — es un string, no una URL real)
   - Anota el **identifier** — ese es tu `AUTH0_API_AUDIENCE`

---

## Dominio + Cloudflare

### 1. Comprar dominio

Comprar en **Cloudflare Registrar** directamente es lo más limpio (precio at-cost, WHOIS privacy gratis, integración nativa con Tunnel). Si compras en GoDaddy/Namecheap/etc, tendrás que cambiar nameservers a Cloudflare después.

### 2. Agregar a Cloudflare (si compraste fuera)

1. Cloudflare dashboard → "Add a site" → tu dominio
2. Selecciona plan Free
3. Cloudflare te muestra 2 nameservers. Cópialos.
4. Ve a tu registrar y cambia los nameservers a esos dos.
5. Espera "Active" en Cloudflare (15min - 1h normalmente).

### 3. Configuración inicial

En Cloudflare dashboard → SSL/TLS → Overview → modo **"Full"** (no Flexible, no Full strict).

---

## Cluster k3s

### En el nodo principal (server)

```bash
curl -sfL https://get.k3s.io | sh -s - server \
  --node-ip <IP-INTERNA> \
  --advertise-address <IP-INTERNA>

# Saca el token para los workers
sudo cat /var/lib/rancher/k3s/server/node-token
```

Donde `<IP-INTERNA>` es la IP que los demás nodos usan para alcanzar este. Si todos están en la misma LAN, es la IP local. Si están en redes distintas, usa una IP de **Tailscale** (recomendado).

### Acceso a kubectl sin sudo

k3s deja el kubeconfig con permisos root-only. Para usar `kubectl` como tu usuario:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
chmod 600 ~/.kube/config
echo 'export KUBECONFIG=$HOME/.kube/config' >> ~/.bashrc
source ~/.bashrc
kubectl get nodes
```

### En cada worker

```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<SERVER-IP>:6443 K3S_TOKEN=<TOKEN> sh -
```

Vuelve al server y verifica:

```bash
kubectl get nodes
# Todos deben aparecer "Ready"
```

### Multi-arquitectura

Si tu cluster mezcla **arquitecturas** (ej: PC amd64 + MacBook M-series arm64), todas las imágenes Docker deben ser multi-arch. Configura buildx una vez:

```bash
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap
```

### Reloj sincronizado en todos los nodos

**Crítico:** si algún nodo tiene reloj desfasado, los certs TLS de los managed services (Atlas, Neon, Cloudflare) fallarán con `certificate not yet valid`. Sincroniza NTP en cada nodo:

```bash
sudo timedatectl set-ntp true
sudo apt install -y chrony   # más confiable que systemd-timesyncd en VMs
sudo systemctl enable --now chrony
```

---

## Build de imágenes

Cada microservicio tiene su Dockerfile. Builda y pushea cada uno multi-arch:

```bash
# Auth
cd auth-service
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/auth-microservice-container:v1.0.0 --push .

# Core
cd ../core-service
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/core-microservice-container:v1.0.0 --push .

# Forum
cd ../forum-service/api
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/forum-microservice-container:v1.0.0 --push .

# Gamification
cd ../../gamification-service/GamificationService
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/gamification-microservice-container:v1.0.0 --push .

# Payment
cd ../../payment-service
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/payment-microservice-container:v1.0.0 --push .

# Enrichment
cd ../enrichment-service
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/enrichment-microservice-container:v1.0.0 --push .

# API Gateway
cd ../api-gateway
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/api-gateway-container:v1.0.0 --push .

# Web app
cd ../web-app/parla
docker buildx build --platform linux/amd64,linux/arm64 \
  -t TU-USER/web-app-container:v1.0.0 --push .
```

Si cambiaste el `TU-USER`, también actualízalo en todos los archivos `k8s/services/*.yaml`, `k8s/gateway/*.yaml`, `k8s/front/*.yaml`.

> **Nota sobre `.env.production` del web-app:** Next.js bakea las variables `NEXT_PUBLIC_*` en el bundle JS **durante el build**. Crea `web-app/parla/.env.production` con las URLs públicas antes del build:
>
> ```bash
> NEXT_PUBLIC_AUTH_URL=https://TU-DOMINIO/api/auth
> NEXT_PUBLIC_CORE_URL=https://TU-DOMINIO/api/core
> NEXT_PUBLIC_GRAPHQL_URL=https://TU-DOMINIO/api/auth/graphql
> NEXT_PUBLIC_FORUM_URL=https://TU-DOMINIO/api/forum
> NEXT_PUBLIC_GAME_URL=https://TU-DOMINIO/api/game
> NEXT_PUBLIC_GAMIFICATION_API_URL=https://TU-DOMINIO/api/game
> NEXT_PUBLIC_AUTH0_AUDIENCE=<tu Auth0 audience>
> APP_BASE_URL=https://TU-DOMINIO
> AUTH0_DOMAIN=<tu Auth0 domain>
> ```

---

## Configurar Secrets locales

Cada servicio tiene una plantilla en `k8s/secrets/*.yaml.example`. Cópialas y rellénalas:

```bash
cd k8s/secrets/
for f in *.yaml.example; do
  cp "$f" "${f%.example}"
done
```

Luego edita cada `.yaml` con los valores reales:

| Archivo | Valores que llenar |
|---|---|
| `auth-service.yaml` | Postgres de Neon (auth_db) |
| `core-service.yaml` | Postgres (core_db) + Mongo Atlas + RabbitMQ CloudAMQP + DeepL API key |
| `forum-service.yaml` | Mongo Atlas (forum_db) |
| `gamification-service.yaml` | Postgres (gamification_db) + Upstash (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_SSL=true) |
| `payment-service.yaml` | Postgres (payment_db) + Mercado Pago tokens |
| `enrichment-service.yaml` | RabbitMQ + Mongo Atlas + Anthropic API key |
| `api-gateway.yaml` | Auth0 domain, audience, Slack webhook (opcional) |
| `web-app.yaml` | Auth0 (todos los campos) + URLs públicas con `https://TU-DOMINIO/...` |

> **Crítico — Convenciones:**
> - Las URLs de servicios internos usan **`api-gateway:8080`** (con guión, con puerto), NO `api_gateway` (underscore).
> - Atlas/Neon/Upstash exigen TLS — verifica que la URL/config lo refleje.
> - Los archivos `*.yaml` (sin `.example`) **están en `.gitignore`** y nunca se commitean.

Ver `k8s/secrets/README.md` para detalles de cada Secret.

---

## Deploy paso a paso

El orden importa. **No saltes pasos.**

### 1. Aplicar Secrets

```bash
kubectl apply -f k8s/secrets/
```

### 2. Reset + migrate de las DBs

Las bases de datos están vacías. El script crea las tablas vía Alembic y siembra categorías iniciales:

```bash
bash scripts/db-reset.sh
```

(Ver el script para detalles. Por defecto hace `DROP SCHEMA public CASCADE` y rebuilds — si tus DBs tienen datos, no corras esto.)

### 3. Generar certs y crear el Secret TLS de nginx

```bash
cd nginx/
bash generate-certs-linux.sh
cd ..
```

Esto crea `nginx/certs/selfsigned.crt` y `.key`, y los carga al cluster como Secret `nginx-tls`.

> **¿Por qué self-signed si Cloudflare ya da TLS?** El cert real que ve el browser es de Cloudflare. Este self-signed solo se usa **entre cloudflared y nginx** (loopback en el mismo host), con `noTLSVerify: true`. Es decorativo desde el punto de vista de seguridad — existe únicamente porque (a) el `nginx.conf` está escrito con `listen 443 ssl` para compatibilidad con `docker-compose`, y nginx falla si declaras SSL sin certs; (b) mantener un solo `nginx.conf` para los dos entornos (dev local + k8s) es más simple que duplicar configs.

### 4. Deploy de microservicios + gateway + web-app

```bash
kubectl apply -f k8s/services/
```

Eso aplica todos los Deployments, Services y ConfigMaps de los microservicios.

### 5. Deploy de nginx (con Kustomize)

```bash
bash scripts/apply-nginx.sh
```

Este script encapsula:

```bash
kustomize build --load-restrictor=LoadRestrictionsNone k8s/nginx/ | kubectl apply -f -
```

La flag `--load-restrictor=LoadRestrictionsNone` permite que Kustomize lea los `nginx.conf` que viven fuera de `k8s/nginx/` (en `nginx/web-app/` y `nginx/extension/`). Ver `k8s/nginx/README.md` para detalles.

### 6. Verificar que todo está Ready

```bash
kubectl get pods -w
```

Espera a que todo aparezca `Running` con `1/1` o `2/2`. Salir con Ctrl+C cuando estable.

---

## Cloudflare Tunnel

Una vez los pods están corriendo y los NodePort responden localmente, configura el tunnel para exponer el cluster al internet sin abrir puertos.

### 1. Login

```bash
cloudflared tunnel login
```

Te abre un browser, autorizas el dominio, queda guardado el cert en `~/.cloudflared/cert.pem`.

### 2. Crear tunnel

```bash
cloudflared tunnel create parla
# Te imprime un UUID — guárdalo
```

### 3. Crear config del tunnel

`~/.cloudflared/config.yml`:

```yaml
tunnel: <TU-UUID>
credentials-file: /home/TU-USER/.cloudflared/<TU-UUID>.json

ingress:
  - hostname: TU-DOMINIO
    service: https://localhost:30443
    originRequest:
      noTLSVerify: true
  - hostname: api.TU-DOMINIO
    service: https://localhost:30444
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

> `noTLSVerify: true` está bien porque el tráfico entre cloudflared y nginx es loopback — no hay red intermedia donde se pueda interceptar.

### 4. Crear DNS records

```bash
cloudflared tunnel route dns parla TU-DOMINIO
cloudflared tunnel route dns parla api.TU-DOMINIO
```

Si te dice "record already exists", borra los records existentes del dominio en Cloudflare DNS dashboard primero.

### 5. Actualizar nginx para aceptar el dominio

Por defecto los `nginx.conf` solo aceptan `Host: localhost`. Edita los dos archivos para agregar tu dominio:

- `nginx/web-app/nginx.conf`: cambiar `server_name localhost;` por `server_name localhost TU-DOMINIO;` (en los dos bloques `listen 443 ssl` y `listen 80`)
- `nginx/extension/nginx.conf`: cambiar `server_name localhost;` por `server_name localhost api.TU-DOMINIO;`

Re-aplica:

```bash
bash scripts/apply-nginx.sh
kubectl rollout restart deployment/nginx-web-app-deployment
kubectl rollout restart deployment/nginx-extension-deployment
```

### 6. Correr el tunnel

```bash
cloudflared tunnel run parla
```

Lo más práctico es dejarlo como servicio systemd:

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

---

## Browser extension

La extensión vive en `browser-extension/`. Tiene URLs hardcodeadas a `localhost` que apuntan a docker-compose. Para producción, actualiza:

| Archivo | URL vieja | URL nueva |
|---|---|---|
| `config/config.js` | `https://localhost:8443` | `https://api.TU-DOMINIO` |
| `background/service-worker.js` | `https://localhost:8443` | `https://api.TU-DOMINIO` |
| `background/auth.js` | `https://localhost/login` | `https://TU-DOMINIO/login` |
| `popup-extension/popup.js` | `https://localhost/*` | `https://TU-DOMINIO/*` |
| `manifest.json` `host_permissions` | `https://localhost:8443/*`, `https://127.0.0.1:8443/*` | `https://api.TU-DOMINIO/*`, `https://TU-DOMINIO/*` |

Carga en Chrome via `chrome://extensions` → "Load unpacked" → seleccionar la carpeta `browser-extension/`.

> Si el `manifest.json` tiene un campo `"key": "..."`, el extension ID es determinístico — siempre el mismo. Saca el ID de `chrome://extensions` y agrégalo al `ALLOWED_ORIGINS` del `gateway-config` (formato: `chrome-extension://<id>`).

---

## Verificación

### Pods sanos

```bash
kubectl get pods
# Todos Running, sin restarts altos
```

### Carga del frontend

Abre `https://TU-DOMINIO` en ventana incógnita. Deberías ver Next.js cargar con candado verde válido (cert de Cloudflare).

### API responde

```bash
curl -i https://api.TU-DOMINIO/api/core/translate -X POST \
  -H "Content-Type: application/json" -d '{}'
# Esperado: 401 con {"error":"Failed to validate JWT"} (porque no mandaste token, pero el backend responde)
```

### Login flow

Click "Login" en la web → te redirige a Auth0 → autenticas → vuelves a `https://TU-DOMINIO`.

### Logs de cada componente

```bash
kubectl logs -f deployment/web-app-deployment
kubectl logs -f deployment/gateway-deployment
kubectl logs -f deployment/auth-deployment
# etc.
```

---

## Troubleshooting

### `error: error loading config file "/etc/rancher/k3s/k3s.yaml": permission denied`

k3s crea el kubeconfig con permisos root-only. Copia a tu home:
```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=$HOME/.kube/config  # agregar a ~/.bashrc
```

### Pod en `CrashLoopBackOff` con exit code 255

Mismatch de arquitectura: la imagen es amd64 pero el nodo es arm64 (o viceversa). Rebuilda multi-arch con buildx.

### `getaddrinfo ENOTFOUND api_gateway`

URL con underscore en algún `.env` o Secret. Cambia a `api-gateway` (con guión). En k8s el DNS de Services usa guiones, no underscores.

### `certificate is not yet valid` al conectar a Atlas/Neon

Reloj del nodo desfasado. Sincroniza NTP:
```bash
sudo timedatectl set-ntp true
sudo systemctl restart chrony
```

### `EOF` desde cloudflared al origen

El nginx está devolviendo `444` (close sin response) porque el `Host` header no matchea `server_name`. Agrega tu dominio a `server_name` en `nginx.conf` y re-aplica.

### `ERR_CERT_AUTHORITY_INVALID` en el browser pero `curl` ve cert válido

Probablemente el Next.js bundle tiene URLs `https://localhost` bakeadas (las `NEXT_PUBLIC_*` se resuelven en build time). Crea `web-app/parla/.env.production` con URLs públicas y rebuilda la imagen.

### Web-app responde `500` con `fetch failed` en logs

Variables de servidor (`SERVER_*_URL`, `AUTH_SERVICE_URL`) apuntan a `localhost` o tienen typo (`api_gateway` vs `api-gateway`). Verifica:
```bash
kubectl exec deployment/web-app-deployment -- env | grep -E "SERVER_|AUTH_SERVICE"
```

### Spring Boot service responde `{"status":false}` o 500 al usar Redis

Upstash exige password y TLS. En `gamification-service/.../application.properties` debe tener:
```properties
spring.data.redis.password=${REDIS_PASSWORD:}
spring.data.redis.ssl.enabled=${REDIS_SSL:false}
```
Y el Secret debe tener `REDIS_HOST` (solo el host, sin URI), `REDIS_PASSWORD`, `REDIS_SSL=true`.

### Jobs de Kubernetes fallan con "field is immutable"

Los Jobs no se pueden re-aplicar con `kubectl apply` después de completar. Borra antes:
```bash
kubectl delete job <nombre> --ignore-not-found
kubectl apply -f <archivo>
```

### Cambié el código pero `kubectl rollout restart` no carga la versión nueva

Si tu tag es fijo (ej. `:v1.0.0`) y `imagePullPolicy: IfNotPresent` (default), k8s usa la imagen cacheada. Soluciones:
- Cambia el tag por release (`:v1.0.1`, `:v1.1.0`)
- Setea `imagePullPolicy: Always` en el Deployment (anti-patrón para producción, OK para dev)

---

## Estructura del repo

```
.
├── DEPLOY.md                  ← este archivo
├── README.md                  ← visión general del proyecto
├── docker-compose.yml         ← stack local de dev
├── postgres-init.sql          ← (legacy, no usado en k8s)
│
├── api-gateway/               ← Go, enruta /api/*
├── auth-service/              ← Python FastAPI + Alembic
├── core-service/              ← Python FastAPI + Alembic
├── forum-service/             ← Python FastAPI (Mongo)
├── gamification-service/      ← Java Spring Boot + Postgres + Redis
├── payment-service/           ← Java Spring Boot
├── enrichment-service/        ← Python FastAPI (Mongo + RabbitMQ + Anthropic)
├── web-app/parla/             ← Next.js frontend
├── browser-extension/         ← Chrome extension
│
├── nginx/
│   ├── web-app/nginx.conf     ← config del nginx para el frontend
│   ├── extension/nginx.conf   ← config del nginx para la extension
│   ├── snippets/              ← security headers compartidos
│   └── generate-certs-linux.sh
│
├── k8s/
│   ├── secrets/               ← Secrets (.yaml gitignored, .yaml.example tracked)
│   ├── services/              ← Deployments + Services + ConfigMaps de microservicios
│   ├── gateway/api-gateway.yaml
│   ├── front/web-app.yaml
│   └── nginx/                 ← Kustomization para los nginx
│
└── scripts/
    ├── db-reset.sh            ← reset + migrate de Postgres y Mongo
    └── apply-nginx.sh         ← wrapper de Kustomize para nginx
```

---

## Referencias rápidas

- **Reset completo desde cero:** Ver `scripts/db-reset.sh` + sección [Deploy](#deploy-paso-a-paso)
- **Secrets:** `k8s/secrets/README.md`
- **Nginx + Kustomize:** `k8s/nginx/README.md`
- **Migrations:** `k8s/migrations/README.md` (aunque ahora se prefiere el script local `scripts/db-reset.sh`)
