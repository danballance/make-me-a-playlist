# Shared base: system packages + user (identical for dev and prod)
FROM python:3.12-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*
RUN groupadd --system app && useradd --system --gid app app

WORKDIR /app

# Dev: deps baked in, source mounted via volume
FROM base AS dev

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8080

CMD ["uvicorn", "api.main:app", "--reload", "--host", "0.0.0.0", "--port", "8080"]

# Builder: full install for prod image
FROM base AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Install dependencies first (layer caching)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source and install the project itself
COPY api/ api/
RUN uv sync --frozen --no-dev

# Prod: minimal runtime, no uv
FROM base AS prod

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/api /app/api

ENV PATH="/app/.venv/bin:$PATH"

USER app

EXPOSE 8080

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
