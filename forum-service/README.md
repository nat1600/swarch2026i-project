# Forum Service

Microservice responsible for managing forum posts and replies. Part of the swarch2026i language learning platform.

## Overview

The forum service exposes a REST API built with FastAPI and persists data in MongoDB via Motor. It handles posts and replies that users create to discuss vocabulary and language learning topics.

## Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Language   | Python 3.13            |
| Framework  | FastAPI                |
| ODM        | Motor 3.x (async)      |
| Database   | MongoDB 7              |
| Validation | Pydantic / pydantic-settings |
| Runtime    | uv                     |

## Project Structure
```
forum-service/
├── app/
│   ├── core/
│   │   ├── config.py          # Settings loaded from .env
│   │   └── dependencies.py    # FastAPI dependency injection (DB)
│   ├── models/                # MongoDB document models
│   ├── routes/                # API endpoints
│   ├── schemas/               # Pydantic request/response schemas
│   ├── services/              # Business logic layer
│   └── main.py                # FastAPI app factory
├── docker-compose.yml         # MongoDB container
├── pyproject.toml
└── .env.example
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:
```env
MONGO_URL=mongodb://localhost:27017
MONGO_DB=forum_db
DEBUG=true
```

## Running Locally

### 1. Start the database
```bash
docker compose up -d
```

### 2. Install dependencies
```bash
uv sync
```

### 3. Run the development server
```bash
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8001 and the interactive docs at http://localhost:8001/docs.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET    | /posts | List all posts |
| POST   | /posts | Create a post |
| GET    | /posts/{id} | Get a post |
| POST   | /posts/{id}/replies | Add a reply |

Interactive docs are available at `/docs` when `DEBUG=true`.