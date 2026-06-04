<div align="center">

<img src="https://hackmd.io/_uploads/H1J6mSBJzg.png" alt="Parla Logo" width="160"/>

# Parla

### Turn your favorite series and movies into an active vocabulary experience.

Capture words from subtitles, build your personal dictionary, review with smart flashcards, and level up with games and challenges.

<br/>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Java](https://img.shields.io/badge/Java-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=flat-square&logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

</div>

---

## Overview

**Parla** is a microservices-based language learning platform designed to help users acquire vocabulary naturally through the content they already enjoy — series, films, and web pages. Instead of relying on traditional memorization techniques, Parla turns passive watching into an interactive learning experience.

A browser extension captures unknown words directly from subtitles as you watch, and the platform takes care of the rest: organized dictionaries, spaced-repetition flashcards, mini-games, streaks, and leaderboards. By combining real-world context with engaging practice methods, Parla helps users build practical vocabulary and improve their ability to communicate naturally.

---

## Features

| Feature | Description |
|---|---|
| **Browser Extension** | Captures words and phrases from subtitles while you watch |
| **Authentication** | Register, login, and session management via Auth0 + JWT |
| **Vocabulary CRUD** | Save phrases with context, translations, and media source |
| **Flashcards** | Spaced repetition using the SM-2 algorithm + Anki export |
| **Fill in the Word** | LLM-generated fill-in-the-blank exercises from your saved phrases |
| **Stopwatch** | Choose the correct translation before time runs out |
| **Matching** | Connect saved phrases with their translations on a board |
| **Phrase Enrichment** | Claude AI automatically generates vocabulary exercises for every saved phrase via RabbitMQ |
| **XP & Streaks** | Earn XP on every game session; daily streak tracking |
| **Leaderboard** | Real-time ranking backed by Redis sorted sets |
| **Forum** | Community discussion and vocabulary sharing |
| **Payments** | Premium subscription management via MercadoPago |

---

## Architectural Structures

Parla is documented through four complementary architectural views.

### Component-and-Connector (C&C) View

![C&C View](https://hackmd.io/_uploads/r1VqB3skMg.png)

> For full resolution, [open in Google Drive](https://drive.google.com/file/d/1cKrM8OPAl4ozoKVShqfPJ64yEEeMpc4o/view?usp=drive_link).

The C&C view describes Parla's runtime architecture. Client apps (`parla-wa` and `parla-ext`) communicate through dedicated NGINX reverse proxies, which forward traffic to a central API Gateway. From there, requests route to six specialized microservices, each with its own data store. Background operations like AI enrichment are decoupled via the `parla-enr-queue` message broker. External dependencies (Auth0, translation, payments, and LLM APIs) integrate at defined boundary points, keeping third-party concerns isolated from the internal service mesh.

**Key runtime elements:**

- **Reverse Proxies:** Two NGINX instances (`parla-rvp-wa`, `parla-rvp-ext`) act as secure entry points, forwarding requests to `parla-gw` via REST.
- **Presentation:** `parla-wa` (TypeScript/Next.js client + SSR server) and `parla-ext` (JavaScript browser extension).
- **API Gateway (`parla-gw`):** Written in Go. Routes traffic to microservices via REST or GraphQL. Runs a structured middleware pipeline: `Security → RequestID → Logging → CORS → RateLimit → Auth → AuditInterceptor → InputValidator`.
- **Microservices:** `parla-idm-ms` (Python, GraphQL), `parla-core-ms`, `parla-frm-ms`, `parla-pay-ms`, `parla-enr-ms` (Python, REST), `parla-gam-ms` (Java).
- **Databases:** PostgreSQL (IDM, Core, GAM, PAY), MongoDB (FRM, ENR), Redis (cache).
- **Message Broker:** `parla-enr-queue` (RabbitMQ, AMQP) for async enrichment between Core, Gamification, Payment, and Enrichment services.

---

### Deployment View

##### General view
![Deployment View](https://hackmd.io/_uploads/HySg1Ciyzx.png)

##### Global components view
![Global Network](https://hackmd.io/_uploads/SJyMJRoyMx.png)

The system is physically distributed across two nodes and two network segments:

- **Node 1 (Cloud):** Hosts NGINX reverse proxies, the SSR server, the API Gateway, all microservices, and the persistence layer (PostgreSQL, Redis, MongoDB).
- **Node 2 (Client/Browser):** The user's local environment running the web app client and the browser extension.
- **`parla-public-net`:** Public-facing segment containing NGINX proxies and the web server.
- **`parla-private-net`:** Restricted segment where the API Gateway, microservices, and databases reside — shielded from direct internet access.
- **External APIs** (global network): `ext-auth0-api`, `ext-vocab-api`, `ext-pay-gw`, `ext-translate-api`, `ext-llm-api`.

---

### Layered View

![Layers View](https://hackmd.io/_uploads/HJYgNk3yfg.png)

![Sub-architectures](https://hackmd.io/_uploads/SklCBynyzx.png)

The system is organized into four strict hierarchical layers, where each layer may only depend on the one immediately below it:

| Layer | Components |
|---|---|
| **Presentation** | `parla-wa` (client + SSR server), `parla-ext` |
| **Communication** | `parla-rvp-wa`, `parla-rvp-ext` (NGINX), `parla-gw` (Go) |
| **Logic** | All microservices + `parla-enr-queue` (RabbitMQ) |
| **Data** | PostgreSQL, MongoDB, Redis |

**Internal sub-architectures:**
- **API Gateway:** Linear pipeline of 9 sequential middleware modules.
- **Gamification Service:** Classic 3-tier — Controllers → Services → Repositories.
- **Core / IDM / Forum / Payment Services:** Routes → Schemas → (Services) → Models.
- **Enrichment Service:** Data-flow pipeline — Queue → Consumer → Enricher → LLM → MongoDB.

---

### Decomposition View

![Decomposition View](https://hackmd.io/_uploads/SkJ0NhoJGe.png)

Parla is decomposed into four core domains:

- **User Module:** Identity, authentication, and progress tracking (daily streaks).
- **Phrases Module:** Vocabulary imports (manual or via browser extension from YouTube/Netflix), flashcards, mini-games, and AI-driven contextual enrichment.
- **Forum Module:** Community threads and collaborative vocabulary sharing.
- **Payment Module:** Premium subscription management to unlock advanced features and gamification modes.

---

## Architectural Patterns

| Pattern | Where Applied |
|---|---|
| **Microservices Architecture** | Entire backend — each service scales and deploys independently |
| **API Gateway** | `parla-gw` centralizes routing, auth, rate limiting, and CORS |
| **Reverse Proxy** | NGINX instances handle TLS termination and shield the backend |
| **Polyglot Persistence** | Each service owns its own database engine (PostgreSQL / MongoDB / Redis) |
| **Polyglot Programming** | Go (gateway), Python (most services), Java (gamification), TypeScript (frontend) |
| **Event-Driven / Async Messaging** | RabbitMQ decouples AI enrichment from the synchronous request cycle |
| **Network Segmentation** | Public and private Docker subnets isolate frontend from backend |
| **Middleware / Interceptor** | Gateway pipeline applies cross-cutting concerns uniformly |
| **Repository Pattern** | Gamification service decouples business logic from data access |
| **Pipes and Filters** | Sequential processing in the gateway pipeline and enrichment flow |

---

## Quality Attributes — Security

Parla implements five security scenarios tested in Prototype 3.

### Scenario 1 : Secure Channel (TLS)

**Vulnerability:** Communication over plain HTTP exposes credentials and payloads to packet sniffing (Wireshark-visible cleartext).

**Countermeasure:** TLS 1.3 termination at the reverse proxy layer. HTTP requests are automatically redirected to HTTPS (`301`). HSTS and `X-Content-Type-Options` headers are injected into all responses. SSL/TLS certificates are managed and auto-renewed centrally.

**Result:** Intercepted traffic is fully encrypted and unreadable.

| Element | Detail |
|---|---|
| **Risk** | High — Confidentiality and Integrity compromised |
| **Attack** | Network sniffing between client and gateway |
| **Weakness** | Unencrypted HTTP endpoints on web app, extension, and gateway |

---

### Scenario 2 : Network Segmentation

**Vulnerability:** All services on a single flat Docker network expose database ports (5432, 27017, 6379, 5672, 15672) directly on the host, enabling lateral movement from any compromised container.

**Countermeasure:** Services split into `parla-public-net` (NGINX proxies, web app) and `parla-private-net` (gateway, microservices, databases). Database port mappings removed from host. NGINX acts as the only controlled bridge between networks.


**Test results:**
- Host scan after segmentation exposed only reverse proxy ports (80, 443, 8080, 8443).
- 11 containers correctly isolated between `parla_public` and `parla_private`.
- Cross-network discovery from `parla_public` reached only the gateway — all internal services hidden.
- Database ports completely removed from host exposure.

| Element | Detail |
|---|---|
| **Risk** | High — Confidentiality and Integrity compromised |
| **Attack** | Container escape + subnet scan to reach databases directly |
| **Weakness** | Single flat `parla-net` with all services reachable from any container |

---

### Scenario 3 : Reverse Proxy (DDoS / Rate Limiting)

**Vulnerability:** Direct access to the API Gateway allows a single attacker to exhaust server resources and make the system unavailable for legitimate users.

**Countermeasure:** NGINX rate limiting at 10 req/s per IP. Attackers are throttled by IP while legitimate users with different IPs are unaffected.

**Test (200 concurrent connections, 30s flood, gateway limited to 0.2 CPU / 64 MB RAM):**

| | Without proxy | With proxy |
|---|---|---|
| Attacker requests processed | 333 (then unresponsive) | 321 out of 207,629 (99.8% rejected with HTTP 429) |
| Legitimate user success rate | 2 / 14 (86% failure) | 14 / 14 (100% success, avg 139ms) |



| Element | Detail |
|---|---|
| **Risk** | High — Availability compromised |
| **Attack** | DDoS flood exhausting gateway processing capacity |
| **Weakness** | Backend accepts unlimited requests per source |

---

### Scenario 4 : Input Validation

**Vulnerability:** `parla-gw` forwarded raw, unvalidated payloads to internal microservices. Prompt injection reached the LLM (mitigated only by Anthropic's own guards). SQL injection payloads were accepted without filtering.

**Countermeasure:** An `InputValidator` middleware added to the gateway pipeline (between `Auth` and `ReverseProxy`) enforces: (1) payload size limit — rejects bodies over 1 MB; (2) pattern filtering — blocks known prompt injection and SQL/NoSQL injection signatures before forwarding.

**Test — prompt injection payload:**

Before: LLM intercepted the attempt internally, but the application itself did not block it.

After: Gateway returned an input validation error immediately.

**Test — SQL injection (`test' OR 1=1 --`):**

Before: Payload accepted and forwarded (no visible data corruption due to backend protections, but no application-layer blocking).

After: Invalid input error returned before the payload reached any service.

| Element | Detail |
|---|---|
| **Risk** | High — Confidentiality and Integrity compromised |
| **Attack** | CAPEC-66 SQL injection / CAPEC-114 prompt injection via `POST /api/core/phrases` |
| **Weakness** | CWE-20 (Improper Input Validation), CWE-345 (Insufficient Data Authenticity Verification) |

---

### Scenario 5 : Centralized Audit (Audit Interceptor)

**Vulnerability:** No centralized monitoring or alerting for suspicious requests, leaving attacks undetected until damage is done.

**Countermeasure:** An `AuditInterceptor` middleware in the gateway pipeline logs all requests to sensitive endpoints and triggers real-time Slack notifications on suspicious activity.

**Result:** Both the prompt injection and SQL injection attempts from Scenarios 3 and 4 were successfully detected and reported via Slack.


| Element | Detail |
|---|---|
| **Risk** | High — Confidentiality, Integrity, and non-repudiation |
| **Countermeasure** | AuditInterceptor middleware with Slack webhook (`parla-slk-wh`) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Web App** | Next.js / React (TypeScript) |
| **Browser Extension** | JavaScript / TypeScript |
| **API Gateway** | Go |
| **Auth Service** | Python (FastAPI) |
| **Core Service** | Python (FastAPI) |
| **Gamification Service** | Java (Spring Boot) |
| **Enrichment Service** | Python (FastAPI + aio-pika) |
| **Forum Service** | Java (Spring Boot) |
| **Payment Service** | Python (FastAPI) |
| **Databases** | PostgreSQL 16 · MongoDB 7 · Redis 7 |
| **Messaging** | RabbitMQ |
| **LLM** | Anthropic Claude |
| **Containerization** | Docker / Docker Compose |

---

## Project Structure

```
swarch2026i-project/
├── api-gateway/           # Entry point — routes requests to microservices (Go)
├── auth-service/          # Authentication & user management (FastAPI)
├── browser-extension/     # Chrome/Firefox extension for subtitle capture
├── core-service/          # Vocabulary, flashcards, and core learning logic (FastAPI)
├── enrichment-service/    # Consumes RabbitMQ queue, calls Claude LLM, stores exercises in MongoDB
├── forum-service/         # Community discussions (Spring Boot)
├── gamification-service/  # XP, streaks, and Redis leaderboard (Spring Boot)
├── payment-service/       # Subscriptions and MercadoPago integration (FastAPI)
├── web-app/               # Frontend — Next.js application (parla/)
├── docs/                  # Architecture diagrams and documentation
├── docker-compose.yml     # Full stack orchestration
└── .gitignore
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- Git

### 1. Clone the repository

```bash
git clone https://github.com/nat1600/swarch2026i-project.git
cd swarch2026i-project
```

### 2. Configure environment variables

Each service needs its own `.env` file. Create them based on the examples below:

<details>
<summary><b>auth-service/.env</b></summary>

```env
# Database
POSTGRES_DB=auth_db
POSTGRES_USER=auth_user
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=changeme
POSTGRES_PORT=5433

# Auth0
AUTH0_DOMAIN=dev-pzxsxsfqc2je00n4.us.auth0.com
AUTH0_API_AUDIENCE=https://parla.com

# API
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```
</details>

<details>
<summary><b>core-service/.env</b></summary>

```env
# Database
POSTGRES_DB=core_db
POSTGRES_USER=core_user
POSTGRES_HOST=database
POSTGRES_PASSWORD=changeme
POSTGRES_PORT=5432

# MongoDB
MONGO_URL=mongodb://localhost:27017
MONGO_DB=core_db

# Translation
DEEPL_API_KEY=your_deepl_api_key_here
LIBRETRANSLATE_URL=https://libretranslate.com

# API
DEBUG=true
```
</details>

<details>
<summary><b>api-gateway/.env</b></summary>

```env
AUTH_SERVICE_URL=http://auth-service
CORE_SERVICE_URL=http://core-service:8000
PORT=8080
```
</details>

<details>
<summary><b>gamification-service/.env</b></summary>

```env
REDIS_HOST=redis
REDIS_PORT=6379
```
</details>

<details>
<summary><b>enrichment-service/.env</b></summary>

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
QUEUE_NAME=word.enrichment
MONGO_URL=mongodb://mongo:27017
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```
</details>

<details>
<summary><b>web-app/parla/.env</b></summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=https://parla.com
```
</details>

> **Never commit `.env` files to version control.** Replace all placeholder values with real keys.
> Get your Anthropic API key at [console.anthropic.com](https://console.anthropic.com) and Auth0 credentials from your [Auth0 dashboard](https://manage.auth0.com).

### 3. Start all services

```bash
docker compose up --build
```

### 4. Access the application

| Service | URL |
|---|---|
| Web App | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Core Service (direct) | http://localhost:8000 |
| Auth DB (Postgres) | localhost:5433 |
| Core DB (Postgres) | localhost:5434 |
| Core DB (MongoDB) | localhost:27018 |

---

## Services

### Auth Service
Handles user registration, login, and JWT session management. Uses PostgreSQL as its database and runs migrations automatically on startup.

### Core Service
The heart of the platform — manages vocabulary entries, flashcard reviews (SM-2 algorithm), and media context. Uses both PostgreSQL for relational data and MongoDB for flexible word/context documents.

### API Gateway
Single entry point for all client requests. Routes traffic to the appropriate microservice, handles CORS, and enforces a structured middleware pipeline including rate limiting, JWT validation, input validation, and audit logging.

### Enrichment Service
Listens on the `word.enrichment` RabbitMQ queue. For each phrase published by the core service, it calls **Anthropic Claude** to generate fill-in-the-blank exercises (sentence + correct answer + 3 distractors) and persists them in the `enrichment_db` MongoDB collection. New phrases are enriched automatically as users save them.

### Gamification Service
Manages XP scoring and the real-time leaderboard backed by **Redis sorted sets**. XP is incremented after every game session. Exposes endpoints for fetching the top leaderboard and a user's current rank and score.

### Payment Service
Manages premium subscriptions and integrates with MercadoPago to unlock advanced features and gamification modes.

### Forum Service
Community-driven discussions, word sharing, and collaborative vocabulary building.

### Web App
Next.js frontend — the main interface for users to manage their vocabulary, review flashcards, play games, and interact with the community.

### Browser Extension
Captures words and phrases directly from subtitles while watching content in the browser (YouTube, Netflix, etc.), sending them to the core service for storage.

---

## Contributors

<table>
  <tr>
    <td align="center"><a href="https://github.com/nat1600"><b>@nat1600</b></a><br/>Karem Nataly Sierra Molina</td>
    <td align="center"><a href="https://github.com/camunozv"><b>@camunozv</b></a><br/>Carlos Ivan Munoz Villazon</td>
    <td align="center"><a href="https://github.com/vmoras"><b>@vmoras</b></a><br/>Valeria Mora Serrano</td>
    <td align="center"><a href="https://github.com/Daniel1309-gon"><b>@Daniel1309-gon</b></a><br/>Daniel Alejandro Gonzalez</td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/dcocinero"><b>@dcocinero</b></a><br/>Daniel Santiago Cocinero</td>
    <td align="center"><a href="https://github.com/DanielGarzon17"><b>@DanielGarzon17</b></a><br/>Daniel Felipe Garzon Mora</td>
    <td align="center"><a href="https://github.com/JuanDanielRamirezMojica"><b>@JuanDanielRamirezMojica</b></a><br/>Juan Daniel Ramirez Mojica</td>
    <td align="center"><a href="https://github.com/MateoAV"><b>@MateoAV</b></a><br/>Mateo Andres Vivas Acosta</td>
  </tr>
</table>

---

## References

- L. Bass, P. Clements, and R. Kazman. *Software Architecture in Practice* (4th ed., pp. 321–350). 2021.
- [Security Patterns — Wikipedia](https://en.wikipedia.org/wiki/Security_pattern)
- [k6 Documentation](https://k6.io/docs/)

---

## License

This project was developed as part of the **Software Architecture (swarch2026i)** course at Universidad Nacional de Colombia. See individual service directories for specific licensing.

---

<div align="center">
  <sub>Built with microservices, caffeine, and a love for language learning.</sub>
</div>

Done
Done
