---
name: react-frontend
description: Use when working on the React frontend — modifying components, routes, queries, stores, or UI configuration
---

## Overview

React 19 single-page application with TanStack Router for file-based routing, TanStack Query for server state, and Zustand for UI state. API client is auto-generated from the backend's OpenAPI schema.

## Stack

| Library | Role | Version |
|---------|------|---------|
| React | UI framework | 19 |
| TanStack Router | File-based routing with type safety | 1.x |
| TanStack Query | Server state & caching | 5.x |
| Zustand | Client-side UI state | 5.x |
| Tailwind CSS | Utility-first styling | 4.x |
| shadcn/ui + Radix | Component primitives | - |
| react-hook-form + Zod | Form handling & validation | 7.x / 4.x |
| Vite | Dev server & bundler | 7.x |
| Vitest + Playwright | Unit & component testing | 4.x |

## Project conventions

- **Feature folders**: `src/features/<name>/` contains components, queries, and stores
- **UI components**: `src/components/ui/` holds shadcn primitives (Button, Card, etc.)
- **Generated code**: `src/api/generated/` is auto-generated — never edit manually
- **Path alias**: `@/` maps to `src/` (configured in tsconfig + vite)
- **Server state vs UI state**: TanStack Query for API data, Zustand for local UI concerns (filters, toggles)
- **Named exports only**: No default exports for components

## Sub-skills index

| Topic | File | When to use |
|-------|------|-------------|
| TanStack Router | `tanstack-router.md` | Adding routes, loaders, navigation |
| TanStack Query | `tanstack-query.md` | Data fetching, mutations, cache management |
| Zustand | `zustand.md` | Client-side state management |
| Component Patterns | `component-patterns.md` | Building UI, forms, styling |
| Testing | `testing.md` | Writing component and unit tests |

## API codegen

The frontend client is generated from `schema/openapi.json` using `@hey-api/openapi-ts` with plugins: `@hey-api/typescript`, `@hey-api/sdk`, `@hey-api/client-fetch`, and `@tanstack/react-query`.

```shell
cd ui && pnpm codegen
```

This generates typed SDK functions and TanStack Query options in `src/api/generated/`. The client base URL is set in `src/api/client.ts`:

```typescript
import { client } from "@/api/generated/client.gen";

client.setConfig({ baseUrl: "/api" });
```

After backend API changes: export schema -> run codegen -> use new generated types.

## Dev server

```shell
cd ui && pnpm dev
```

Vite proxies `/api/*` to `http://localhost:8080` (the backend), stripping the `/api` prefix (so `/api/items` hits `/items` on the backend). TanStack Router plugin auto-generates the route tree with code splitting enabled.

**Note**: This is a [Copier](https://copier.readthedocs.io/) template project. Some files (e.g. `index.tsx.jinja`, `package.json.jinja`) use Jinja templating. When adding new routes or components, create plain `.tsx` files — the `.jinja` variants are only for template scaffolding.

## Key docs links

- React: <https://react.dev/reference/react>
- TanStack Router: <https://tanstack.com/router/latest/docs/framework/react/overview>
- TanStack Query: <https://tanstack.com/query/latest/docs/framework/react/overview>
- Zustand: <https://zustand.docs.pmnd.rs/getting-started/introduction>
