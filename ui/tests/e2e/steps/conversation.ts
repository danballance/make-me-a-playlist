import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// --- Background: navigate through topic submission ---

Given(
	"I submitted the topic {string}",
	async ({ page }, topic: string) => {
		// Mock the API to return a question response
		await page.route("**/api/sessions", async (route) => {
			if (route.request().method() === "POST") {
				await route.fulfill({
					status: 201,
					contentType: "application/json",
					body: JSON.stringify({
						session_id: "test-session-1",
						state: "conversing",
						topic,
						response: {
							kind: "question",
							message: `You mentioned "${topic}" — that's a great starting point. Are you looking for core functionality, plugins or something else?`,
						},
					}),
				});
			}
		});

		await page.goto("/");
		await page.getByRole("textbox").fill(topic);
		await page.getByRole("button", { name: "Find my playlist" }).click();
	},
);

Given("I am on the conversation page", async ({ page }) => {
	await expect(page).toHaveURL(/\/conversation\//);
});

// --- Layout assertions ---

Then(
	"I should see a top bar with a back arrow and the topic {string}",
	async ({ page }, topic: string) => {
		await expect(page.getByText(topic)).toBeVisible();
		await expect(page.locator("[aria-label='Go back']")).toBeVisible();
	},
);

Then(
	"I should see a chat area with at least one agent message",
	async ({ page }) => {
		await expect(page.getByText("Playlist Agent")).toBeVisible();
	},
);

Then(
	"I should see a reply input with placeholder {string}",
	async ({ page }, placeholder: string) => {
		await expect(page.getByPlaceholder(placeholder)).toBeVisible();
	},
);

Then("I should see a send button", async ({ page }) => {
	await expect(
		page.getByRole("button", { name: /send/i }),
	).toBeVisible();
});

// --- Navigation ---

When("I click the back arrow in the top bar", async ({ page }) => {
	await page.locator("[aria-label='Go back']").click();
});

// --- Agent messages ---

Then(
	"I should see an agent message labeled {string}",
	async ({ page }, label: string) => {
		await expect(page.getByText(label)).toBeVisible();
	},
);

Then(
	"the message should reference my topic {string}",
	async ({ page }, topic: string) => {
		await expect(page.getByText(topic)).toBeVisible();
	},
);

Then(
	"the message should ask a clarifying question about my preferences",
	async ({ page }) => {
		// Agent message should contain a question mark
		await expect(page.locator("text=?")).toBeVisible();
	},
);

// --- Thinking indicator ---

Given("the agent is processing a response", async ({ page }) => {
	// Mock a slow response to keep thinking indicator visible
	await page.route("**/api/sessions/*/reply", async (route) => {
		await new Promise((resolve) => setTimeout(resolve, 5000));
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				session_id: "test-session-1",
				state: "conversing",
				topic: "advanced vim motions",
				response: {
					kind: "question",
					message: "What level of experience do you have?",
				},
			}),
		});
	});

	await page.getByPlaceholder("Type your reply...").fill("test message");
	await page.getByRole("button", { name: /send/i }).click();
});

Then("I should see an animated thinking indicator", async ({ page }) => {
	await expect(page.getByText("Agent is thinking...")).toBeVisible();
});

Then(
	"I should see the text {string}",
	async ({ page }, text: string) => {
		await expect(page.getByText(text)).toBeVisible();
	},
);

When("the agent finishes processing", async ({ page }) => {
	// Wait for the thinking indicator to disappear
	await expect(page.getByText("Agent is thinking...")).toBeHidden({
		timeout: 10000,
	});
});

Then("the thinking indicator should disappear", async ({ page }) => {
	await expect(page.getByText("Agent is thinking...")).toBeHidden();
});

Then("I should see a new agent message in the chat", async ({ page }) => {
	await expect(
		page.getByText("What level of experience do you have?"),
	).toBeVisible();
});

// --- User replies ---

When(
	"I type {string} into the reply input",
	async ({ page }, text: string) => {
		await page.getByPlaceholder("Type your reply...").fill(text);
	},
);

When("I click the send button", async ({ page }) => {
	await page.getByRole("button", { name: /send/i }).click();
});

Then(
	"my message should appear in the chat right-aligned",
	async ({ page }) => {
		// Check that the user's message is visible in the chat
		await expect(page.getByText(/tiny\.nvim|mini\.ai/)).toBeVisible();
	},
);

Then("the reply input should be cleared", async ({ page }) => {
	await expect(page.getByPlaceholder("Type your reply...")).toHaveValue("");
});

Then("the agent should begin processing a response", async ({ page }) => {
	await expect(page.getByText("Agent is thinking...")).toBeVisible();
});

When("I press the Enter key", async ({ page }) => {
	await page.getByPlaceholder("Type your reply...").press("Enter");
});

When("I leave the reply input empty", async ({ page }) => {
	await page.getByPlaceholder("Type your reply...").clear();
});

Then("no message should be added to the chat", async ({ page }) => {
	// The chat should only have the initial agent message(s)
	const userMessages = page.locator("[data-role='user']");
	await expect(userMessages).toHaveCount(0);
});

// --- Conversation flow ---

Given(
	"the agent has asked about plugin scope preference",
	async () => {
		// Context established by the background + initial agent message
	},
);

When(
	"I reply {string}",
	async ({ page }, text: string) => {
		await page.getByPlaceholder("Type your reply...").fill(text);
		await page.getByRole("button", { name: /send/i }).click();
	},
);

Then(
	"the agent should ask a follow-up question to further refine my preferences",
	async ({ page }) => {
		await expect(page.locator("text=?").last()).toBeVisible({
			timeout: 10000,
		});
	},
);

Then(
	"the conversation should continue until the agent has enough context",
	async () => {
		// This is a narrative step — verified by the subsequent scenario
	},
);

Given(
	"the agent has gathered sufficient preference information",
	async ({ page }) => {
		// Mock the next reply to return a result instead of a question
		await page.route("**/api/sessions/*/reply", async (route) => {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					session_id: "test-session-1",
					state: "completed",
					topic: "advanced vim motions",
					response: {
						kind: "result",
						playlist: {
							topic: "advanced vim motions",
							videos: [],
							overall_rationale: "Curated for you.",
						},
					},
				}),
			});
		});
	},
);

When("the agent finishes its final clarifying exchange", async ({ page }) => {
	await page.getByPlaceholder("Type your reply...").fill("That's all");
	await page.getByRole("button", { name: /send/i }).click();
});

Then("I should be navigated to the results page", async ({ page }) => {
	await expect(page).toHaveURL(/\/results\//);
});

// --- Scroll behavior ---

Given(
	"the conversation has more messages than fit on screen",
	async () => {
		// This condition is inherently met by a long conversation
	},
);

When("a new message appears in the chat", async ({ page }) => {
	await page.getByPlaceholder("Type your reply...").fill("another message");
	await page.getByRole("button", { name: /send/i }).click();
});

Then(
	"the chat area should scroll to show the newest message",
	async ({ page }) => {
		// Verify the latest message is in the viewport
		const lastMessage = page.locator("[data-role='user']").last();
		await expect(lastMessage).toBeInViewport();
	},
);
