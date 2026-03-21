## Project layout

├── backend
│   ├── api
│   │   ├── shared
│   │   ├── todo
│   │   └── user
│   └── tests
│       ├── todo
│       └── user
├── docs
│   └── ADRs
├── schema
├── tasks
└── ui
    ├── public
    ├── src
    │   ├── api
    │   ├── components
    │   ├── features
    │   ├── lib
    │   └── routes
    └── tests
        ├── components
        ├── e2e
        └── mocks

Note: Be sure to create all design and planning documents in the
`/tasks/plans` and `/tasks/designs` directories, not `/docs`.

## Coding Standards

### Python

- All code must be covered by unit tests.
- Unit tests are written with pytest in the function-style (not TestClass style).
- Interfaces are critically important in software development.
- Remember SOLID.
- Implemement interfaces using Protocol classes.
- Avoid bare functions - instead think of methods attached to Protocols
- Interfaces using Protocols means we get plugins, i.e. Open for extension, closed for modification.
- Every parameter, field and retuen type must be fully typed using the typing module.
- Avoid vague types like dict and prefer TypedDict or dedicated classes.
- Use Pydantic BaseModel classes instead of dataclasses.
- Aim for elegant, composable, orthogonal, pluggable BaseModeligns.
- Avoid complexity - complexity is the software killer.
- Never use the `global` keyword.
- Never re-export as "all" from `__init__.py`.
- Import from package submodules and never `from {package} import *`.
- Only import from the top of the module - never inline within a code block.

### Linting

Linting is handled by shell scripts in `.claude/scripts/`. These are called
automatically by Claude Code hooks, but can also be run manually:

```shell
# Python (backend)
bash .claude/scripts/lint-py.sh fast ./backend     # fast: format + lint + type
bash .claude/scripts/lint-py.sh full ./backend     # full: fast + arch + deadcode + security + complexity
bash .claude/scripts/lint-py.sh strict ./backend   # strict: full + wemake-python-styleguide

# TypeScript (frontend)
bash .claude/scripts/lint-ts.sh fast ./ui           # fast: format + lint + type
bash .claude/scripts/lint-ts.sh full ./ui           # full: fast + deadcode

# Formatting (auto-fix)
cd backend && uv run ruff format .
cd ui && npx biome format --write .

# Fix lint issues (auto-fix)
cd backend && uv run ruff check --fix .
cd ui && npx biome lint --fix .
```

## General guidelines

Behavioral guidelines to reduce common coding mistakes.
Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

    State your assumptions explicitly. If uncertain, ask.
    If multiple interpretations exist, present them - don't pick silently.
    If a simpler approach exists, say so. Push back when warranted.
    If something is unclear, stop. Name what's confusing. Ask.

### Simplicity First

Minimum code that solves the problem. Nothing speculative.

    No features beyond what was asked.
    No abstractions for single-use code.
    No "flexibility" or "configurability" that wasn't requested.
    No error handling for impossible scenarios.
    If you write 200 lines and it could be 50, rewrite it.
    Prefer consistency over configurability.
    A simpler, consistent interface is a primitive that can be built upon.
    A seemingly "powerful" interface with many options increases complexity and maintenance burden.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

    Don't "improve" adjacent code, comments, or formatting.
    Don't refactor things that aren't broken.
    Match existing style, even if you'd do it differently.
    If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

    Remove imports/variables/functions that YOUR changes made unused.
    Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

    "Add validation" → "Write tests for invalid inputs, then make them pass"
    "Fix the bug" → "Write a test that reproduces it, then make it pass"
    "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

