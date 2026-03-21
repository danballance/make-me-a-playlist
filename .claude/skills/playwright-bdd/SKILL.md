---
name: playwright-bdd
description: Use when writing E2E tests from Gherkin feature files — creating .feature files, step definitions, and running BDD tests
---

## Overview

playwright-bdd generates Playwright Test files from Gherkin `.feature` files and TypeScript step definitions. Tests are **UI-only** — every assertion must be something observable in the browser. Never test backend internals, API payloads, or agent state from BDD tests.

## Stack

| Library | Role | Version |
|---------|------|---------|
| playwright-bdd | Gherkin-to-Playwright generator | 8.x |
| @playwright/test | Browser automation & assertions | 1.x |
| Cucumber Expressions | Step parameter matching (`{string}`, `{int}`) | via playwright-bdd |

## File structure

```
ui/
├── playwright-bdd.config.ts          # BDD-specific Playwright config
├── tests/e2e/
│   ├── features/                     # Gherkin feature files
│   │   └── topic-input.feature
│   ├── steps/                        # Step definitions (one per feature)
│   │   └── topic-input.ts
│   └── todo.spec.ts                  # Standard Playwright tests (separate)
└── .features-gen/                    # Generated test files (gitignored)
```

Config is separate from `playwright.config.ts` so BDD and standard E2E tests coexist.

## Workflow

1. **Write the `.feature` file** in `tests/e2e/features/`
2. **Write step definitions** in `tests/e2e/steps/` — one file per feature
3. **Run tests**: `cd ui && pnpm test:bdd`

The `test:bdd` script runs `bddgen` (generates Playwright tests from features + steps into `.features-gen/`) then executes them with Playwright.

## Writing feature files

Use standard Gherkin syntax. Every step must describe user-visible behavior:

```gherkin
Feature: Topic Input
  As a user
  I want to describe a vibe, mood, or theme
  So that the AI agent can search YouTube for hidden gems matching my interest

  Background:
    Given I am on the topic input page

  Scenario: Viewing the landing page
    Then I should see the heading "Make me a playlist"
    And I should see a description mentioning "YouTube" and "hidden gems"
    And I should see a text input with placeholder "advanced vim motions"
    And I should see a "Find my playlist" button

  Scenario: Submitting a valid topic
    When I type "history of synthesizers" into the topic input
    And I click "Find my playlist"
    Then I should be navigated to the conversation page
    And I should see "history of synthesizers" in the conversation

  Scenario Outline: Submitting various topic formats
    When I type "<topic>" into the topic input
    And I click "Find my playlist"
    Then I should be navigated to the conversation page

    Examples:
      | topic                            |
      | late night jazz for coding       |
      | 90s hip-hop deep cuts            |
```

### Conventions

- **Background** for shared setup (navigation) across all scenarios
- **Scenario** for specific cases with concrete values
- **Scenario Outline + Examples** for parameterized variations
- **UI-only assertions**: write "I should see X" or "I should be navigated to Y", never "the backend should receive X" or "the agent should have processed X"
- Steps should be reusable across features — write them generically (e.g., `I click {string}` not `I click the submit button`)

## Writing step definitions

Use the `createBdd()` functional API with Playwright locators:

```typescript
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given("I am on the topic input page", async ({ page }) => {
  await page.goto("/");
});

Then("I should see the heading {string}", async ({ page }, heading: string) => {
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
});

When(
  "I type {string} into the topic input",
  async ({ page }, topic: string) => {
    await page.getByRole("textbox").fill(topic);
  },
);

When("I click {string}", async ({ page }, label: string) => {
  await page.getByRole("button", { name: label }).click();
});

Then("I should be navigated to the conversation page", async ({ page }) => {
  await expect(page).toHaveURL(/\/conversation/);
});
```

### Step definition rules

- Every step function is `async` with destructured `{ page }` from Playwright fixtures
- Parameters use Cucumber Expressions: `{string}`, `{int}`, `{float}`
- Type-annotate all parameters (e.g., `heading: string`)
- One step definition file per feature file, matching the filename

## Locator strategy

Prefer semantic locators in this order:

| Locator | Use for | Example |
|---------|---------|---------|
| `getByRole` | Buttons, headings, textboxes, checkboxes | `page.getByRole("button", { name: "Submit" })` |
| `getByPlaceholder` | Input fields with placeholder text | `page.getByPlaceholder("Search...")` |
| `getByText` | Static text content, descriptions | `page.getByText("Welcome")` |
| `getByLabel` | Form fields with labels | `page.getByLabel("Email")` |
| `toHaveURL` | Page navigation assertions | `expect(page).toHaveURL("/dashboard")` |

Avoid CSS selectors and test IDs when a semantic locator works. Use `.and()` to intersect locators when matching elements containing multiple text fragments.

## Running tests

```shell
cd ui && pnpm test:bdd          # Generate + run BDD tests
cd ui && pnpm test:e2e          # Standard Playwright E2E tests (separate)
```

To run via Docker (avoids NixOS browser lib issues):

```shell
docker compose --profile test-bdd run playwright-bdd
```

To verify step matching without running the browser:

```shell
cd ui && pnpm exec bddgen --config playwright-bdd.config.ts
```

If `bddgen` reports missing steps, add them to the step definitions file before running tests.

## Adding a new feature

1. Create `tests/e2e/features/<feature-name>.feature` with Gherkin scenarios
2. Create `tests/e2e/steps/<feature-name>.ts` with step definitions
3. Run `pnpm exec bddgen --config playwright-bdd.config.ts` to verify all steps match
4. Run `pnpm test:bdd` — new scenarios will fail until the UI is built (this is expected in BDD)
5. Build the UI to make scenarios pass one by one

Reuse existing step definitions across features where possible (e.g., `I click {string}` is generic). If a step is shared, consider extracting it to `tests/e2e/steps/common.ts`.

## Key docs links

- playwright-bdd: <https://vitalets.github.io/playwright-bdd/>
- Playwright: <https://playwright.dev/docs/intro>
- Cucumber Expressions: <https://github.com/cucumber/cucumber-expressions>
- Gherkin Reference: <https://cucumber.io/docs/gherkin/reference/>
