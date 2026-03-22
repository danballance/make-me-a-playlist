# Pi integration

This project ships with two [Pi coding agent](https://github.com/nicepkg/pi) extensions
that auto-load when you run `pi` from the project root.

## Getting started

Install Pi globally:

```bash
npm install -g @mariozechner/pi-coding-agent
```

Run Pi from the project root:

```bash
pi
```

Both extensions load automatically from `.pi/extensions/`. No `pi install`, no
`npm install`, no configuration needed.

## Extensions

### pied-pi (development harness)

Guides the agent through structured development phases. Activate it with:

```
/harness
```

The harness walks through five phases defined in `.pied-pi/harness.json`:

| Phase | Requires | Confirm? | Skill |
|---|---|---|---|
| Research | — | yes | research |
| Design | research | no | design |
| Plan | research | yes | planning |
| Implementation | plan | no | implementation |
| Documentation | implement | no | documentation |

Each phase injects its skill (from `.pied-pi/skills/`) into the system prompt so
the agent follows the right process for that stage.

Check current progress:

```
/phase
```

### lint-guard (automated lint enforcement)

Runs linters automatically during agent work. Two behaviors:

**Lint on edit** — after every file edit or write, runs a fast lint check on the
changed file. If lint fails, the agent sees the errors and must fix them before
continuing.

**Lint on stop** — when the agent finishes its work, runs strict Python lint and
full TypeScript lint. If either fails, the agent is sent back to fix the issues.
A circuit breaker allows completion after 3 failed attempts to prevent infinite
loops.

## Lint tiers

### Python (`lint-py.sh`)

| Tier | Checks |
|---|---|
| fast | ruff format, ruff check, ty check |
| full | fast + lint-imports, vulture, bandit, complexipy |
| strict | full + flake8 wemake-python-styleguide |
| fix | ruff check --fix (auto-fix only) |
| format | ruff format (auto-fix only) |

### TypeScript (`lint-ts.sh`)

| Tier | Checks |
|---|---|
| fast | biome format, biome lint, tsc --noEmit |
| full | fast + knip (dead code) |

## Running lint scripts manually

```bash
# Python
bash .pi/extensions/lint-guard/scripts/lint-py.sh fast ./backend
bash .pi/extensions/lint-guard/scripts/lint-py.sh full ./backend
bash .pi/extensions/lint-guard/scripts/lint-py.sh strict ./backend

# TypeScript
bash .pi/extensions/lint-guard/scripts/lint-ts.sh fast ./ui
bash .pi/extensions/lint-guard/scripts/lint-ts.sh full ./ui

# Auto-fix
bash .pi/extensions/lint-guard/scripts/lint-py.sh fix ./backend
bash .pi/extensions/lint-guard/scripts/lint-py.sh format ./backend
```

## Directory structure

```
.pi/
  extensions/
    pied-pi/              # Development harness extension
      index.ts
      config.ts
      helpers.ts
      types.ts
      tools.ts
      commands.ts
    lint-guard/            # Automated lint extension
      index.ts
      lint-on-edit.ts
      lint-on-stop.ts
      utils.ts
      scripts/
        lint-py.sh
        lint-ts.sh
      tests/
        vitest.config.ts
        utils.test.ts
.pied-pi/
  harness.json            # Phase definitions
  skills/                 # Skill files injected per phase
    research/SKILL.md
    documentation/SKILL.md
    feature-descriptions/SKILL.md
    implementation/SKILL.md
    mockups/SKILL.md
    planning/SKILL.md
```

## Customizing

**Harness phases** — edit `.pied-pi/harness.json` to add, remove, or reorder
phases. Each phase needs `name`, `label`, `requires` (dependencies), `confirm`
(pause for user approval), and `skill` (directory name under `.pied-pi/skills/`).

**Skills** — add or edit markdown files in `.pied-pi/skills/<name>/SKILL.md`.
The skill content is injected into the system prompt when that phase is active.

**Lint tiers** — edit the scripts in `.pi/extensions/lint-guard/scripts/` to add
or remove checks from each tier.

## Running extension tests

The lint-guard extension has unit tests for its routing and circuit breaker logic:

```bash
cd .pi/extensions/lint-guard
npm install
npx vitest run --config tests/vitest.config.ts
```
