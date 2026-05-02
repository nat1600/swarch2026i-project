FROM python:3.13-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev


RUN uv run python -m spacy download en_core_web_sm

COPY . .

CMD ["uv", "run", "python", "-m", "app.consumer"]