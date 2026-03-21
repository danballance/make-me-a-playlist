# Docker

Use these files after generating a project from this template. We do not run Docker
from the template repository itself.

## Which file to use

- `docker-compose.yml`: local development
- `docker-compose.prod.yml`: build production images locally
- `docker-compose.images.yml`: run prebuilt images in CI or production

Both dev and prod use the same Dockerfiles (multi-stage builds with `dev` and `prod`
targets). This ensures system packages, base images, and user setup are identical
across environments.

## Local development

Start the dev stack:

```bash
docker compose up --build -d api ui
```

Open the app at:

```text
http://localhost:3000
```

View logs:

```bash
docker compose logs -f api ui
```

Stop everything:

```bash
docker compose down
```

After changing dependencies (pyproject.toml/uv.lock or package.json/pnpm-lock.yaml),
rebuild the images:

```bash
docker compose up --build -d api ui
```

For a clean reset (e.g. after regenerating with Copier, or to clear cached
node_modules):

```bash
docker compose down -v --remove-orphans
```

## Local E2E tests with Playwright

Start the app services:

```bash
docker compose up --build -d api ui
```

Run Playwright as a one-shot container:

```bash
docker compose run --rm playwright
```

Why this is the recommended flow:

- `playwright` is a one-shot test container
- `run --rm` avoids stale test containers between runs
- the test resets backend todo state through the API before each test

## CI

If CI should run the containerized E2E path, use the same sequence as local:

```bash
docker compose up --build -d api ui
docker compose run --rm playwright
docker compose down -v --remove-orphans
```

If CI is building release images, use:

```bash
docker compose -f docker-compose.prod.yml build
```

## Coolify or other production deployment

If the platform builds from source, use:

```bash
docker compose -f docker-compose.prod.yml up --build
```

If the platform should run published images, use:

```bash
API_IMAGE=ghcr.io/org/app:tag UI_IMAGE=ghcr.io/org/app-ui:tag \
docker compose -f docker-compose.images.yml up
```

Use `docker-compose.images.yml` when image build happens in CI and the deployment
environment should only pull immutable image tags.
