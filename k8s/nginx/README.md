# Nginx — Web App y Extension

Dos deployments de nginx que sirven como **reverse proxy con terminación TLS**:

- `nginx-web-app` → recibe tráfico del navegador, lo enruta al frontend Next.js y a los microservicios vía web-app
- `nginx-extension` → recibe tráfico de la extensión de Chrome, lo enruta directamente al api-gateway

Son deployments separados porque tienen **superficies de ataque, rate limits, timeouts y bases de clientes distintas**. Si uno cae, el otro sigue funcionando.

## Estructura

```
k8s/nginx/
├── kustomization.yaml      # Orquesta todo: recursos + genera ConfigMaps
├── web-app.yaml            # Deployment + Service para nginx-web-app
├── extension.yaml          # Deployment + Service para nginx-extension
└── README.md               # Este archivo

nginx/                      # (fuera de k8s/) — archivos fuente
├── web-app/nginx.conf      # Config completa del nginx web-app
├── extension/nginx.conf    # Config completa del nginx extension
├── snippets/
│   └── security-headers.conf  # Headers compartidos por web-app
├── certs/                  # ⚠️ gitignored — generados localmente
│   ├── selfsigned.crt
│   └── selfsigned.key
└── generate-certs-linux.sh # Genera certs + crea el Secret nginx-tls
```

## Setup paso a paso

### 1. Generar certs y crear el Secret TLS

```bash
cd nginx/
bash generate-certs-linux.sh
```

El script hace dos cosas:

1. Genera `certs/selfsigned.crt` y `certs/selfsigned.key` con OpenSSL (válido por 1 año, CN=localhost).
2. Aplica el Secret `nginx-tls` al cluster con el patrón idempotente:
   ```bash
   kubectl create secret tls nginx-tls --cert=... --key=... \
     --dry-run=client -o yaml | kubectl apply -f -
   ```
   El `--dry-run=client -o yaml | kubectl apply` permite **reejecutar el script** sin error si el Secret ya existe — `kubectl apply` lo actualiza.

**Por qué no creamos los certs como un ConfigMap:** los ConfigMaps no tienen ninguna protección. Cualquiera con acceso al namespace los lee. Los Secrets están codificados en base64 y tienen RBAC separado — no es encriptación real, pero sí es un nivel más de control.

### 2. Instalar `kustomize` standalone (una sola vez)

El kustomize embebido en `kubectl` (lo que se usa con `kubectl apply -k`) **no permite leer archivos fuera de la carpeta del `kustomization.yaml`** por seguridad. Como nuestros `nginx.conf` viven en `../../nginx/` (compartidos con docker-compose), necesitamos el binario standalone que sí expone la flag para relajar ese check.

```bash
curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
sudo mv kustomize /usr/local/bin/
kustomize version
```

**Por qué existe esta restricción:** el default (`LoadRestrictionsRootOnly`) protege contra `kustomization.yaml` de terceros (Helm-style, marketplace) que podrían leer archivos arbitrarios del sistema (ej. `/etc/passwd`). Como nosotros controlamos el repo entero, desactivarlo es seguro.

**Por qué no movemos los configs a `k8s/nginx/`:** romperíamos `docker-compose.yml` que los lee desde `nginx/web-app/nginx.conf`. Mantenerlos en un solo lugar (con Kustomize leyendo "hacia arriba") es la arquitectura correcta.

### 3. Aplicar los Deployments + ConfigMaps

Desde la raíz del repo:

```bash
kustomize build --load-restrictor=LoadRestrictionsNone k8s/nginx/ | kubectl apply -f -
```

Kustomize hace dos cosas que `kubectl apply -f` directo no haría:

1. **Genera los ConfigMaps automáticamente** desde los archivos `nginx/*/nginx.conf` y `nginx/snippets/security-headers.conf`. Así no duplicas el contenido de los configs en los YAML — el único source of truth son los `.conf`.
2. **Le pone un hash al nombre del ConfigMap** (`nginx-web-app-config-abc123`). Cuando cambies el `.conf`, el hash cambia → k8s ve un ConfigMap "nuevo" → hace rolling update del Deployment automáticamente.

Sin Kustomize tendrías que:
- Copiar el contenido del `.conf` dentro del YAML (duplicación)
- Forzar manualmente el rolling update cuando cambies el config (`kubectl rollout restart deployment/...`)

> **Atajo:** para no escribir el comando largo cada vez, hay un script en `scripts/apply-nginx.sh` que lo encapsula. Solo corres `bash scripts/apply-nginx.sh`.

### 4. Verificar

```bash
kubectl get pods -l app=nginx-web-app
kubectl get pods -l app=nginx-extension
kubectl get secret nginx-tls
kubectl get svc nginx-web-app-service nginx-extension-service
```

## Cómo se montan los archivos en el contenedor

Cada pod de nginx tiene tres montajes:

```yaml
volumeMounts:
- name: nginx-config                          # config principal
  mountPath: /etc/nginx/nginx.conf
  subPath: nginx.conf
- name: nginx-snippets                        # security headers (solo web-app)
  mountPath: /etc/nginx/snippets/security-headers.conf
  subPath: security-headers.conf
- name: tls-certs                             # certs HTTPS
  mountPath: /etc/nginx/certs
  readOnly: true
```

Detalles importantes:

- **`subPath`**: sin él, k8s montaría el ConfigMap como un **directorio**, reemplazando todo `/etc/nginx/` y borrando los demás archivos que nginx necesita (`mime.types`, `fastcgi_params`, etc). Con `subPath` solo reemplaza ese archivo.
- **`readOnly: true` en los certs**: defensa en profundidad. Si el proceso nginx fuera comprometido, no podría sobreescribir sus propios certificados.
- **El Secret `nginx-tls`** es compartido por ambos deployments (web-app y extension). Es el mismo cert porque ambos sirven `CN=localhost`.

## Puertos expuestos

| Service | NodePort HTTP | NodePort HTTPS |
|---|---|---|
| `nginx-web-app-service` | 30080 | 30443 |
| `nginx-extension-service` | 30081 | 30444 |

Cada NodePort debe ser único en el cluster — por eso `extension` no puede usar 30080/30443.

## Producción: por qué los self-signed certs no sirven

En producción **nadie genera certs con OpenSSL a mano**. Hay dos approaches estándar:

### Opción A — cert-manager + Let's Encrypt
Instalas el cert-manager en el cluster. Le declaras un `Certificate` apuntando a tu dominio. El controller pide automáticamente un cert real a Let's Encrypt (gratis), lo guarda como Secret, y lo **renueva automáticamente cada 60 días** antes de que expire.

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: parla-tls
spec:
  secretName: nginx-tls          # ← el mismo nombre que usamos hoy
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - parla.example.com
```

La gracia es que el Deployment **no cambia** — sigue referenciando `nginx-tls`. Solo cambia quién crea ese Secret (cert-manager en vez del script).

### Opción B — Certs corporativos vía External Secrets
Tu equipo de seguridad maneja los certs en una PKI propia o un servicio managed (AWS ACM). Sincronizas con External Secrets Operator igual que los demás secretos.

## TL;DR del flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│   nginx/web-app/nginx.conf    nginx/extension/nginx.conf              │
│   nginx/snippets/security-*.conf                                      │
│                  │                                                    │
│                  │ Kustomize lee → genera ConfigMaps                  │
│                  ▼                                                    │
│         nginx-web-app-config    nginx-extension-config                │
│         nginx-snippets-config                                         │
│                                                                       │
│   nginx/certs/selfsigned.{crt,key}                                    │
│                  │                                                    │
│                  │ generate-certs-linux.sh → crea Secret              │
│                  ▼                                                    │
│         nginx-tls (Secret)                                            │
│                                                                       │
│   web-app.yaml         extension.yaml                                 │
│         │                    │                                        │
│         │ kustomize build ... | kubectl apply -f -                    │
│         ▼                    ▼                                        │
│   nginx-web-app-deployment   nginx-extension-deployment               │
│   nginx-web-app-service      nginx-extension-service                  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```
