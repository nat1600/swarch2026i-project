# Core Service

Microservice responsible for managing vocabulary phrases and their spaced-repetition review data. Part of the [swarch2026i language learning platform](../README.md).

## Overview

The core service exposes a REST API built with **FastAPI** and persists data in **PostgreSQL** via **SQLAlchemy**. It handles phrases that users capture from subtitles, storing the original text, translation, pronunciation, and the SM-2 scheduling fields needed for flashcard reviews.

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Language    | Python 3.14                       |
| Framework   | FastAPI                           |
| ORM         | SQLAlchemy 2.x                    |
| Database    | PostgreSQL 16                     |
| Validation  | Pydantic / pydantic-settings      |
| Runtime     | uv                                |

## Project Structure

```
core-service/
├── alembic/
│   ├── versions/              # Auto-generated migration scripts (committed to repo)
│   ├── env.py                 # Alembic runtime config; imports all models for autogenerate
│   └── README
├── app/
│   ├── core/
│   │   ├── config.py          # Settings loaded from .env
│   │   └── dependencies.py    # FastAPI dependency injection (DB session)
│   ├── models/
│   │   ├── base.py            # Declarative base with created_at timestamp
│   │   ├── language.py        # Language model
│   │   ├── phrase.py          # Phrase and ReviewData models
│   │   └── review.py
│   ├── routes/
│   │   └── phrases.py         # /phrases endpoints
│   ├── schemas/
│   │   └── phrases.py         # Pydantic request/response schemas
│   ├── services/
│   │   └── phrase_service.py  # Business logic layer
│   └── main.py                # FastAPI app factory
├── scripts/
│   └── migrate.sh             # Convenience wrapper: prints state, runs upgrade head
├── alembic.ini                # Alembic configuration file
├── docker-compose.yml         # PostgreSQL container
├── pyproject.toml
└── .env.example
```

## Data Models

### `Phrase`
Stores a vocabulary entry captured by a user.

| Column               | Type        | Description                        |
|----------------------|-------------|------------------------------------|
| `id`                 | int (PK)    |                                    |
| `active`             | bool        | Soft-delete flag (default `true`)  |
| `user_id`            | int         | Owner (references auth-service)    |
| `source_language_id` | int (FK)    | Language being learned from        |
| `target_language_id` | int (FK)    | Known language by the user         |
| `original_text`      | str         | Text in the source language        |
| `translated_text`    | str         | Translation in the target language |
| `pronunciation`      | str \| None | Optional phonetic guide            |
| `last_reviewed_date` | datetime    | When the phrase was last reviewed  |
| `next_review_date`   | datetime    | SM-2 scheduled next review date    |
| `created_at`         | datetime    | Auto-set on insert                 |

### `ReviewData`
Holds the SM-2 algorithm state for each phrase.

| Column                      | Type     | Description                        |
|-----------------------------|----------|------------------------------------|
| `id`                        | int (PK) |                                    |
| `phrase_id`                 | int (FK) |                                    |
| `repetition_number`         | int      | Number of successful reviews (≥ 0) |
| `easiness_factor`           | decimal  | SM-2 E-factor (1.3 – 2.5)          |
| `inner_repetition_interval` | int      | Current interval in days           |

## API Endpoints

| Method | Path       | Description              |
|--------|------------|--------------------------|
| `GET`  | `/phrases` | List all phrases         |

Interactive docs are available at `/docs` when `DEBUG=true`.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```env
# Name of the PostgreSQL database
POSTGRES_DB=core_db

# PostgreSQL role used by the service to connect
POSTGRES_USER=core_user

# Hostname or IP where PostgreSQL is running (use 'database' when in Docker)
POSTGRES_HOST=localhost

# Password for the PostgreSQL role above
POSTGRES_PASSWORD=changeme

# Port PostgreSQL listens on (default: 5432)
POSTGRES_PORT=5432

# Set to true to enable the interactive docs at /docs (disable in production)
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

### 3. Apply migrations

```bash
bash scripts/migrate.sh
```

### 4. Run the development server

```bash
uvicorn app.main:app --reload 
```

The API will be available at `http://localhost:8000` and the interactive docs at `http://localhost:8000/docs`.

## Database Migrations

Migrations are managed with [Alembic](https://alembic.sqlalchemy.org/). All migration scripts live in `alembic/versions/` and are committed to the repository — never edit them by hand after they have been applied.

### Check the current migration state

```bash
uv run alembic current
```

### Create a new migration after changing a model

```bash
uv run alembic revision --autogenerate -m "short description of change"
```

Review the generated file in `alembic/versions/` before applying it. Autogenerate cannot detect every kind of change (e.g. renamed columns), so always verify the output.

### Apply all pending migrations

```bash
uv run alembic upgrade head
# or use the convenience script:
bash scripts/migrate.sh
```

### Roll back the last migration

```bash
uv run alembic downgrade -1
```
