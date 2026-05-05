#  Parla — Language Learning Through Series & Movies

> Turn your favorite series and movies into an active vocabulary experience.  
> Capture words from subtitles, build your personal dictionary, review with smart flashcards, and level up with games and challenges.

---

##  Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Services](#services)
- [Contributors](#contributors)

---

## Overview

**Parla** is a microservices-based language learning platform designed for people who want to learn vocabulary naturally — through the content they already love. A browser extension captures unknown words directly from subtitles as you watch, and the platform takes care of the rest: organized dictionaries, spaced-repetition flashcards, mini-games, streaks, and leaderboards.

---

## Features

| Feature | Description |
|---|---|
| **Browser Extension** | Captures words and phrases from subtitles while watching |
| **Authentication** | Register, login, and manage sessions via Auth0 + JWT |
| **Vocabulary CRUD** | Save phrases with context, translations, and media source |
| **Flashcards** | Spaced repetition using the SM-2 algorithm + Anki export |
| **Fill in the Word** | LLM-generated fill-in-the-blank exercises using your saved phrases |
| **Stopwatch** | Choose the correct translation before time runs out |
| **Matching** | Connect your saved phrases with their translations on a board |
| **Phrase Enrichment** | Anthropic Claude automatically generates vocabulary exercises for every saved phrase via RabbitMQ |
| **XP & Streaks** | Earn XP on every game session; daily streak tracking |
| **Leaderboard** | Real-time ranking backed by Redis sorted sets |
| **Forum** | Community discussion and vocabulary sharing |

---

## Architecture

The platform follows a **microservices architecture** with an API Gateway as the single entry point. Each service owns its own database and communicates through the gateway.

![Diagrama Arquitectura-C C](https://github.com/user-attachments/assets/0c6786d9-abeb-4fcb-bd7d-9fe5a1529500)


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
| **Databases** | PostgreSQL 16 + MongoDB 7 + Redis 7 |
| **Messaging** | RabbitMQ |
| **LLM** | Anthropic Claude (phrase enrichment) |
| **Containerization** | Docker / Docker Compose |

---

## Project Structure

```
swarch2026i-project/
├── api-gateway/          # Entry point — routes requests to microservices (Go)
├── auth-service/         # Authentication & user management (FastAPI)
├── browser-extension/    # Chrome/Firefox extension for subtitle capture
├── core-service/         # Vocabulary, flashcards, and core learning logic (FastAPI)
├── enrichment-service/   # Consumes RabbitMQ queue, calls Claude LLM, stores exercises in MongoDB
├── forum-service/        # Community discussions (Spring Boot)
├── gamification-service/ # XP, streaks, and Redis leaderboard (Spring Boot)
├── web-app/              # Frontend — Next.js application (parla/)
├── docs/                 # Architecture diagrams and documentation
├── docker-compose.yml    # Full stack orchestration
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

**`auth-service/.env`**
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

**`core-service/.env`**
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

**`api-gateway/.env`**
```env
AUTH_SERVICE_URL=http://auth-service
CORE_SERVICE_URL=http://core-service:8000
PORT=8080
```

**`gamification-service/.env`**
```env
REDIS_HOST=redis
REDIS_PORT=6379
```

**`enrichment-service/.env`**
```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
QUEUE_NAME=word.enrichment
MONGO_URL=mongodb://mongo:27017
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**`web-app/parla/.env`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=https://parla.com
```

> **Note:** Never commit `.env` files to version control. Replace placeholder values with real keys. Get an Anthropic API key at [console.anthropic.com](https://console.anthropic.com) and Auth0 credentials from your [Auth0 dashboard](https://manage.auth0.com).

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

###  Auth Service
Handles user registration, login, and JWT session management. Uses PostgreSQL as its database. Runs migrations automatically on startup.

###  Core Service
The heart of the platform — manages vocabulary entries, flashcard reviews (SM-2 algorithm), and media context. Uses both PostgreSQL (relational data) and MongoDB (flexible word/context documents).

###  API Gateway
Single entry point for all client requests. Routes traffic to the appropriate microservice, handles CORS, and can enforce authentication middleware.

### Enrichment Service
Listens on the `word.enrichment` RabbitMQ queue. For each phrase published by the core service, it calls **Anthropic Claude** to generate multiple fill-in-the-blank exercises (sentence + correct answer + 3 distractors) and persists them in the `enrichment_db` MongoDB collection. New phrases are enriched automatically as users save them.

### Gamification Service
Manages XP scoring and the real-time leaderboard backed by **Redis sorted sets**. XP is incremented after every game session. Exposes endpoints for fetching the top leaderboard and a user's current rank and score.

### Forum Service
Community-driven discussions, word sharing, and collaborative vocabulary building.

###  Web App
Next.js frontend — the main interface for users to manage their vocabulary, review flashcards, play games, and interact with the community.

###  Browser Extension
Captures words and phrases directly from subtitles while watching content in the browser, sending them to the core service for storage.

---

## Contributors

| GitHub | Role |
|---|---|
| [@nat1600](https://github.com/nat1600) | Contributor |
| [@camunozv](https://github.com/camunozv) | Contributor |
| [@vmoras](https://github.com/vmoras) | Contributor |
| [@Daniel1309-gon](https://github.com/Daniel1309-gon) | Contributor |
| [@dcocinero](https://github.com/dcocinero) | Contributor |
| [@DanielGarzon17](https://github.com/DanielGarzon17) | Contributor |
| [@JuanDanielRamirezMojica](https://github.com/JuanDanielRamirezMojica) | Contributor |
| [@MateoAV](https://github.com/MateoAV) | Contributor |

---

## License

This project was developed as part of the **Software Architecture (swarch2026i)** course. See individual service directories for specific licensing.
