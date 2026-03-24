import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

Given(
	"I completed a conversation about {string}",
	async ({ page }, _topic: string) => {
		// This step would navigate through topic input and conversation to reach results.
		// For E2E tests, we need a running backend with a mock or real session that completes.
		// For now, navigate directly to a results page with a known session ID.
		// This will be refined when the backend is running.
		await page.goto("/");
		// The full flow will be: submit topic -> conversation -> agent completes -> results
	},
);

Given("I am on the results page", async ({ page }) => {
	await expect(page).toHaveURL(/\/results\//);
});

Then(
	"I should see the title {string} in the results header",
	async ({ page }, title: string) => {
		await expect(page.getByText(title).first()).toBeVisible();
	},
);

Then(
	"I should see a topic tag displaying {string}",
	async ({ page }, topic: string) => {
		await expect(page.getByText(topic)).toBeVisible();
	},
);

Then(
	"I should see a subtitle indicating the number of videos found",
	async ({ page }) => {
		await expect(page.getByText(/\d+ video/i)).toBeVisible();
	},
);

Then(
	"I should see an overall rationale explaining the curation strategy",
	async ({ page }) => {
		// The rationale section should be visible with some text content
		const rationale = page.locator("[data-testid='overall-rationale']");
		await expect(rationale).toBeVisible();
		await expect(rationale).not.toBeEmpty();
	},
);

Then("each video card should display a thumbnail", async ({ page }) => {
	const cards = page.locator("[data-testid='video-card']");
	const count = await cards.count();
	expect(count).toBeGreaterThan(0);
	for (let i = 0; i < count; i++) {
		await expect(cards.nth(i).locator("img, [data-testid='thumbnail']")).toBeVisible();
	}
});

Then("each video card should display a title", async ({ page }) => {
	const cards = page.locator("[data-testid='video-card']");
	const count = await cards.count();
	expect(count).toBeGreaterThan(0);
	for (let i = 0; i < count; i++) {
		await expect(
			cards.nth(i).getByRole("heading"),
		).toBeVisible();
	}
});

Then("each video card should display a channel name", async ({ page }) => {
	const cards = page.locator("[data-testid='video-card']");
	const count = await cards.count();
	expect(count).toBeGreaterThan(0);
	for (let i = 0; i < count; i++) {
		await expect(
			cards.nth(i).locator("[data-testid='channel-name']"),
		).toBeVisible();
	}
});

Then("each video card should display a rationale", async ({ page }) => {
	const cards = page.locator("[data-testid='video-card']");
	const count = await cards.count();
	expect(count).toBeGreaterThan(0);
	for (let i = 0; i < count; i++) {
		await expect(
			cards.nth(i).locator("[data-testid='video-rationale']"),
		).toBeVisible();
	}
});

Then("I should see 5 video cards", async ({ page }) => {
	const cards = page.locator("[data-testid='video-card']");
	await expect(cards).toHaveCount(5);
});

Then(
	"they should be numbered sequentially from 1 to 5",
	async ({ page }) => {
		const ranks = page.locator("[data-testid='video-rank']");
		await expect(ranks).toHaveCount(5);
		for (let i = 0; i < 5; i++) {
			await expect(ranks.nth(i)).toHaveText(String(i + 1));
		}
	},
);


