FROM python:3.13-slim

WORKDIR /app

RUN pip install uv

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN uv sync --no-dev

COPY . .

EXPOSE 8005
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
