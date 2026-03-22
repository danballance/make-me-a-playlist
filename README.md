# make-me-a-playlist

A full-stack web application

## Getting Started with Pi

This project uses the [pi coding agent](https://github.com/mariozechner/pi-coding-agent) with a development harness that guides work through structured phases.

### Starting the Harness

Run `/harness` in pi to activate the development workflow. The harness enforces four sequential phases:

1. **Planning** — design the solution, write a plan to `tasks/plans/`
2. **Test Creation** — write failing tests bottom-up before implementation
3. **Implementation** — execute the plan, make tests pass
4. **Documentation** — update docs, ADRs, and clean up

Use `/phase` at any time to check your current progress.

### Available Skills

The project includes domain-specific skills in `.pi/skills/` that pi loads on demand:

| Skill | Purpose |
|-------|---------|
| `litestar` | Backend framework patterns, DI, ORM, OpenAPI |
| `react-frontend` | TanStack Router/Query, Zustand, component patterns |
| `playwright-bdd` | E2E testing with Gherkin feature files |
| `recommender` | The recommender package API and CLI |

### Further Reading

See `docs/development-pipeline.md` for the full development pipeline, command reference, and verification gates.
