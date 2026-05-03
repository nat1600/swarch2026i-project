# enrichment-service

Word enrichment microservice for the **Parla** platform. Given a word and the student's level, it automatically generates a contextual sentence with a blank space and three distractors to build vocabulary quiz exercises.

---

## What does it do?

1. Listens for messages from a RabbitMQ queue (`enrichment_queue`)
2. For each message, calls the LLM (Anthropic Claude) with the target word and the student's level
3. The LLM generates:
   - A contextual sentence using `___` as the blank space
   - Three plausible but incorrect distractors
4. Stores the enriched result in MongoDB

### Example Output

```json
{
  "phrase_id": 5,
  "sentence": "The ___ barked loudly at the stranger.",
  "correct_answer": "dog",
  "distractors": ["cat", "bird", "horse"],
  "level": "B1"
}
```

---

## Architecture

```text
RabbitMQ (enrichment_queue)
        ↓
enrichment-service
        ↓
Anthropic Claude (ext-llm-api)
        ↓
MongoDB
```

---

## Project Structure

```text
enrichment-service/
├── app/
│   ├── __init__.py
│   ├── config.py          # Environment configuration
│   ├── models.py          # Pydantic models
│   ├── enricher.py        # Entry point: RabbitMQ consumer
│   ├── consumer.py        # Enrichment workflow orchestration
│   ├── llm_client.py      # Anthropic client
│   └── mongo_client.py    # MongoDB client
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── uv.lock
├── .env
└── .env.example
```

---

## Environment Variables

Create a `.env` file in the root of the project.

---

## Running the Service

### Using Docker Compose (recommended)

```bash
docker compose up --build
```

---

### Local Development

Start infrastructure services:

```bash
docker compose up rabbitmq mongodb -d
```

Install dependencies:

```bash
uv sync
```

Run the service:

```bash
uv run python -m app.enricher
```

---

## Testing the Service

Once the service is running, you should see:

```text
INFO Listening to queue 'enrichment_queue'...
```

Open RabbitMQ Management UI:

```text
http://localhost:15672
```

Credentials:

```text
Username: guest
Password: guest
```

Navigate to:

```text
Queues → enrichment_queue → Publish message
```

Publish the following test message:

```json
{
  "phrase_id": 1,
  "original_text": "The dog runs in the park",
  "word": "dog",
  "level": "B1"
}
```

Supported CEFR levels:

```text
A1, A2, B1, B2, C1, C2
```

If `level` is omitted, the default value is `B1`.

---

## Verify Results in MongoDB

Open MongoDB shell:

```bash
docker exec -it enrichment-service-mongodb-1 mongosh
```

Then run:

```javascript
use enrichment_db
db.enriched_phrases.find().pretty()
```

---

## RabbitMQ Message Format

| Field | Type | Required | Description |
|---|---|---|---|
| `phrase_id` | int | Yes | Unique phrase identifier |
| `original_text` | string | Yes | Original sentence containing the word |
| `word` | string | Yes | Word to enrich |
| `level` | string | No | Student CEFR level (default: `B1`) |

---

## Tech Stack

- Python 3.13
- aio-pika — asynchronous RabbitMQ consumer
- Anthropic SDK — Claude API client
- Motor — asynchronous MongoDB client
- Pydantic — message validation
- uv — dependency manager
- spaCy — NLP preprocessing
- **Pydantic** — validación de mensajes
- **uv** — gestor de dependencias