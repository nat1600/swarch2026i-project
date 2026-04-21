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
|  **Browser Extension** | Captures words and phrases from subtitles while watching |
|  **Authentication** | Register, login, and manage sessions with JWT |
|  **Vocabulary CRUD** | Save words with context, definitions, and media source |
|  **Flashcards** | Spaced repetition using the SM-2 algorithm + Anki export |
|  **Solo Games** | Fill-in-the-blank, word match, and typing challenges |
|  **Streaks** | Daily study tracking to keep you motivated |
|  **Leaderboard** | Weekly top-10 ranking with automatic reset |
|  **Forum** | Community discussion and vocabulary sharing |

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
| **API Gateway** | Node.js / TypeScript |
| **Auth Service** | Python (FastAPI) |
| **Core Service** | Python (FastAPI) |
| **Gamification Service** | Java (Spring Boot) |
| **Forum Service** | Java (Spring Boot) |
| **Databases** | PostgreSQL 16 + MongoDB 7 |
| **Containerization** | Docker / Docker Compose |

---

## Project Structure

```
swarch2026i-project/
├── api-gateway/          # Entry point — routes requests to microservices
├── auth-service/         # Authentication & user management
├── browser-extension/    # Chrome/Firefox extension for subtitle capture
├── core-service/         # Vocabulary, flashcards, and core learning logic
├── forum-service/        # Community discussions
├── gamification-service/ # Games, streaks, and leaderboard
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

**`web-app/parla/.env`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

> **Note:** Never commit `.env` files to version control. The `DEEPL_API_KEY` above is a placeholder — replace it with your own key from [DeepL API](https://www.deepl.com/pro-api).

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

### Gamification Service
Manages solo games (fill-in-the-blank, word match, typing), daily streaks, and the weekly leaderboard (top 10 with automatic reset).

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
