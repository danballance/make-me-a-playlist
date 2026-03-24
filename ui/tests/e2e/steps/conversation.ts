import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

Given(
	"I submitted the topic {string}",
	async ({ page }, topic: string) => {
		await page.goto("/");
		await page.getByRole("textbox").fill(topic);
		await page.getByRole("button", { name: "Find my playlist" }).click();
		await expect(page).toHaveURL(/\/conversation\//);
	},
);

Given("I am on the conversation page", async ({ page }) => {
	await expect(page).toHaveURL(/\/conversation\//);
});

Then(
	"I should see a top bar with a back arrow and the topic {string}",
	async ({ page }, topic: string) => {
		await expect(page.getByText(topic).first()).toBeVisible();
		// back arrow should be present as a link or button
		await expect(
			page.getByRole("link", { name: /back/i }).or(
				page.locator("[aria-label='Go back']"),
			),
		).toBeVisible();
	},
);

Then(
	"I should see a chat area with at least one agent message",
	async ({ page }) => {
		await expect(page.getByText("Playlist Agent").first()).toBeVisible();
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

When("I click the back arrow in the top bar", async ({ page }) => {
	await page
		.getByRole("link", { name: /back/i })
		.or(page.locator("[aria-label='Go back']"))
		.click();
});

Then(
	"I should see an agent message labeled {string}",
	async ({ page }, label: string) => {
		await expect(page.getByText(label).first()).toBeVisible();
	},
);

Then(
	"the agent message should reference my topic {string}",
	async ({ page }, topic: string) => {
		// The agent's first message should mention the topic
		const agentMessages = page.locator("[data-role='agent']");
		await expect(agentMessages.first()).toContainText(topic);
	},
);

When(
	"I type {string} into the reply input",
	async ({ page }, message: string) => {
		await page.getByPlaceholder("Type your reply...").fill(message);
	},
);

When("I click the send button", async ({ page }) => {
	await page.getByRole("button", { name: /send/i }).click();
});

Then(
	"my message should appear in the chat right-aligned",
	async ({ page }) => {
		const userMessages = page.locator("[data-role='user']");
		await expect(userMessages.last()).toBeVisible();
	},
);

Then("the reply input should be cleared", async ({ page }) => {
	await expect(page.getByPlaceholder("Type your reply...")).toHaveValue("");
});

When("I press the Enter key in the reply input", async ({ page }) => {
	await page.getByPlaceholder("Type your reply...").press("Enter");
});

When("I leave the reply input empty", async ({ page }) => {
	await page.getByPlaceholder("Type your reply...").clear();
});

Then("no new message should be added to the chat", async ({ page }) => {
	const userMessages = page.locator("[data-role='user']");
	await expect(userMessages).toHaveCount(0);
});
