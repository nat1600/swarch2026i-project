# enrichment-service

Word enrichment microservice for the **Parla** platform. Given a phrase and the student's level, it automatically extracts content words, generates a contextual sentence with a blank space and three distractors for each word, to build vocabulary quiz exercises.

---

## What does it do?

1. Listens for messages from a RabbitMQ queue (`enrichment_queue`)
2. For each message:
   - Removes stop words from the original text using NLTK
   - Extracts content words from the sentence
   - Checks whether each word already exists in MongoDB
   - Calls the LLM (Anthropic Claude) only for new words
3. The LLM generates for each word:
   - A contextual sentence in the target language using `___` as the blank
   - Three plausible but incorrect distractors in the same language
4. Stores one MongoDB document per enriched word

---

## Example Input

```json
{
  "phrase_id": 1,
  "original_text": "The winner takes it all after a long fight",
  "level": "B1",
  "language": "english"
}
```

---

## Example Output

```json
{
  "phrase_id": 20,
  "word": "winner",
  "sentence": "After winning the competition, she became a national ___.",
  "correct_answer": "winner",
  "distractors": ["runner", "player", "coach"],
  "level": "B1",
  "language": "english"
}
```

---

## Stop Word Filtering

The service automatically removes stop words before generating exercises.

For example:

```text
"The winner takes it all after a long fight"
```

After stop word filtering:

```text
winner takes long fight
```

Generated exercises:

- `winner`
- `takes`
- `long`
- `fight`

Filtered stop words:

- `the`
- `it`
- `all`
- `after`
- `a`

This avoids generating exercises for low-value grammatical words.

---

## Architecture

```text
RabbitMQ (enrichment_queue)
        ↓
enrichment-service
  ├── NLTK stop word filter
  ├── MongoDB deduplication check
  └── Anthropic Claude (ext-llm-api)
        ↓
MongoDB (one document per word)
```

---

## Project Structure

```text
enrichment-service/
├── app/
│   ├── __init__.py
│   ├── config.py          # Environment configuration
│   ├── models.py          # Pydantic models
│   ├── enricher.py        # RabbitMQ entry point
│   ├── consumer.py        # Enrichment workflow
│   ├── llm_client.py      # Anthropic Claude client
│   └── mongo_client.py    # MongoDB operations
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── uv.lock
├── .env
└── .env.example
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
QUEUE_NAME=enrichment_queue

MONGO_URL=mongodb://mongodb:27017
MONGO_DB=enrichment_db
MONGO_COLLECTION=enriched_phrases

ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXX
```

---

## Running the Service

### Using Docker Compose (recommended)

```bash
docker compose up --build
```

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

Once the service is running you should see:

```text
INFO Listening to queue 'enrichment_queue'...
```

Open RabbitMQ Management UI:

```text
http://localhost:15672
```

Credentials:

```text
user: guest
password: guest
```

Navigate to:

```text
Queues → enrichment_queue → Publish message
```

Publish:

```json
{
  "phrase_id": 20,
  "original_text": "The winner takes it all after a long fight",
  "level": "B1",
  "language": "english"
}
```

This generates one MongoDB document per content word:

- `winner`
- `takes`
- `long`
- `fight`

Supported CEFR levels:

```text
A1, A2, B1, B2, C1, C2
```

Default level:

```text
B1
```

Supported languages:

```text
english, spanish, french, german, portuguese, ...
```

Any language supported by NLTK stop words can be used.

Default language:

```text
english
```

---

## Integrating with this Service

This microservice is a **RabbitMQ consumer**. It does not expose an HTTP API.

To integrate with it, another service must publish messages into the queue.

---

## Publishing Messages

### Python Example

```python
import asyncio
import json
import aio_pika

async def publish_enrichment_message(
    phrase_id: int,
    text: str,
    level: str = "B1",
    language: str = "english"
):
    connection = await aio_pika.connect_robust(
        "amqp://guest:guest@localhost:5672/"
    )

    async with connection:
        channel = await connection.channel()

        await channel.declare_queue(
            "enrichment_queue",
            durable=True
        )

        message = {
            "phrase_id": phrase_id,
            "original_text": text,
            "level": level,
            "language": language,
        }

        await channel.default_exchange.publish(
            aio_pika.Message(
                body=json.dumps(message).encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            ),
            routing_key="enrichment_queue",
        )

asyncio.run(
    publish_enrichment_message(
        phrase_id=42,
        text="The winner takes it all after a long fight",
        level="B1",
        language="english",
    )
)
```

---

## Processing Workflow

After a message is published:

1. The service receives the message from RabbitMQ
2. Stop words are removed from the sentence
3. Remaining content words are extracted
4. Existing `(phrase_id, word)` combinations are skipped
5. The LLM generates exercises for new words only
6. Results are stored in MongoDB

Processing is fully asynchronous.

---

## Reading Results from MongoDB

### Python Example

```python
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")

collection = client["enrichment_db"]["enriched_phrases"]

# Get all enriched words for a phrase
results = await collection.find(
    {"phrase_id": 42}
).to_list(length=None)

# Check whether a specific word already exists
doc = await collection.find_one({
    "phrase_id": 42,
    "word": "winner"
})
```

---

## MongoDB Document Structure

```json
{
  "phrase_id": 42,
  "word": "winner",
  "sentence": "After winning the competition, she became a national ___.",
  "correct_answer": "winner",
  "distractors": ["runner", "player", "coach"],
  "level": "B1",
  "language": "english"
}
```

---

## Verify Results in MongoDB

Open Mongo shell:

```bash
docker exec -it enrichment-service-mongodb-1 mongosh
```

Run:

```javascript
use enrichment_db
db.enriched_phrases.find().pretty()
```

---

## RabbitMQ Message Format

| Field | Type | Required | Description |
|---|---|---|---|
| `phrase_id` | int | Yes | Unique phrase identifier |
| `original_text` | string | Yes | Original sentence to process |
| `level` | string | No | Student CEFR level |
| `language` | string | No | Target language |

Defaults:

```text
level    = B1
language = english
```

---

## Important Considerations

- Messages are persistent
- If the service is offline, messages remain in RabbitMQ until processed
- Duplicate `(phrase_id, word)` combinations are skipped
- One MongoDB document is generated per content word
- Processing is asynchronous
- Results must be retrieved from MongoDB

---


## Running the Tests

```bash
uv run pytest tests/ -v
```

Unit tests cover the core enrichment logic without requiring any external services (no RabbitMQ, MongoDB, or Anthropic API needed).

| Module | What is tested |
|---|---|
| `consumer.py` | Stop word filtering, enrichment workflow |
| `llm_client.py` | LLM response parsing and error handling |
| `models.py` | Pydantic model validation and defaults |

---

## Tech Stack

- Python 3.13
- aio-pika — asynchronous RabbitMQ consumer
- Anthropic SDK — Claude API client
- Motor — asynchronous MongoDB client
- NLTK — stop word filtering
- Pydantic — message validation
- uv — dependency manager