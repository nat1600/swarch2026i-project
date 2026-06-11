# Secrets

Esta carpeta contiene los Secrets de Kubernetes para cada componente del sistema.

## Cómo está organizado

| Archivo | Tracked en git | Contiene |
|---|---|---|
| `*.yaml.example` | ✅ Sí | Plantilla con las **claves** que el Secret necesita y descripciones de qué va en cada valor |
| `*.yaml` | ❌ No (`.gitignore`) | Los Secrets **reales** con valores poblados |

Esto es el patrón estándar de "ejemplo público + real privado": cualquiera que clone el repo sabe qué claves debe definir, pero los valores sensibles (passwords, API keys, tokens) nunca salen del entorno local.

## Setup local

Para cada `*.yaml.example`, copia y rellena:

```bash
cp k8s/secrets/auth-service.yaml.example k8s/secrets/auth-service.yaml
# Editar k8s/secrets/auth-service.yaml con los valores reales
```

Luego aplica los Secrets al cluster:

```bash
kubectl apply -f k8s/secrets/
```

Hazlo **antes** de aplicar los Deployments — si un Deployment arranca y no encuentra el Secret que referencia (`secretRef: name: foo-secret`), el pod queda en `CreateContainerConfigError`.

## Cómo los consumen los Deployments

Cada Deployment trae los valores del Secret como variables de entorno usando `envFrom`:

```yaml
envFrom:
  - secretRef:
      name: auth-secret
```

Eso inyecta **todas las claves del Secret** como variables de entorno del contenedor. Es lo mismo que `env_file: .env` en docker-compose, pero con la ventaja de que k8s los almacena por separado de los ConfigMaps y los protege con RBAC.

## Producción: por qué este approach no es suficiente

Lo que hacemos acá tiene dos problemas en producción:

1. **Los valores reales viven en el laptop del dev.** Si alguien rota una API key, todos los demás devs quedan con valores viejos hasta que pidan al equipo el archivo actualizado.
2. **No hay auditoría.** Nadie sabe quién leyó o cambió un Secret.
3. **No hay rotación automática.** Si una credencial se filtra, hay que tocar manualmente cada cluster.

Las tres alternativas que la industria usa para resolver esto:

### Opción A — Sealed Secrets (Bitnami)
Encriptas el Secret con la public key del controller del cluster, lo commiteas a git (sí, el archivo encriptado va a git), y solo el cluster puede desencriptarlo. Resuelve el problema de "valores reales en laptops" porque el archivo encriptado **es** el source of truth.

```bash
kubeseal --format=yaml < auth-service.yaml > auth-service.sealed.yaml
# auth-service.sealed.yaml SÍ va a git
```

### Opción B — External Secrets Operator
Los valores viven en un servicio externo (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault). El operator los sincroniza al cluster como Secrets nativos. Auditoría y rotación las maneja el sistema externo.

### Opción C — Vault
Los pods piden el Secret directamente a Vault en runtime usando un service account. Nunca toca el etcd de k8s. Es el approach con más overhead operativo pero el más seguro.

Para este proyecto universitario nos quedamos con la opción de `.yaml` gitignored — es suficiente para aprender el flujo y deployar, pero **es importante saber que esto no es lo que se hace en producción**.

## Lista de Secrets

| Nombre | Componente | Contenido principal |
|---|---|---|
| `web-app-secret` | Next.js frontend | Credenciales Auth0, URLs públicas |
| `gateway-secret` | API Gateway (Go) | Auth0 domain/audience, Slack webhook |
| `auth-secret` | Auth Service | Credenciales Postgres |
| `core-secret` | Core Service | Postgres + Mongo + RabbitMQ + DeepL API key |
| `forum-secret` | Forum Service | Mongo Atlas credentials |
| `gamification-secret` | Gamification (Spring Boot) | Postgres + Redis |
| `payment-secret` | Payment Service | Mercado Pago tokens + Postgres |
| `enrichment-secret` | Enrichment Service | RabbitMQ + Mongo + Anthropic API key |
| `nginx-tls` | nginx (web-app y extension) | Cert y key TLS para HTTPS — **no se crea desde estos YAML**, ver `k8s/nginx/README.md` |
