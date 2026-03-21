# Shared base: node + pnpm
FROM node:22-alpine AS base

RUN corepack enable pnpm

WORKDIR /app

# Dev: env setup only, deps installed at runtime (volume mount shadows node_modules)
FROM base AS dev

EXPOSE 5173

CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm run codegen && pnpm dev --host"]

# Builder: full build for prod
FROM base AS builder

# Install dependencies first (layer caching)
COPY ui/package.json ui/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy schema for API client generation
COPY schema/openapi.json ../schema/openapi.json

# Copy source
COPY ui/ .

# Generate API client from OpenAPI schema
RUN pnpm run codegen

# Build using the project's canonical build script so type-checking and bundling stay aligned.
RUN pnpm run build

# Prod: static assets on Caddy
FROM caddy:2-alpine AS prod

COPY ui/Caddyfile /etc/caddy/Caddyfile
COPY --from=builder /app/dist /srv/dist
