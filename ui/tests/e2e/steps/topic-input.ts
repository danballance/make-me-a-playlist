import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { When, Then } = createBdd();

Then(
	"I should see a description mentioning {string} and {string}",
	async ({ page }, text1: string, text2: string) => {
		const description = page.getByText(text1).and(page.getByText(text2));
		await expect(description).toBeVisible();
	},
);

Then(
	"I should see a text input with placeholder {string}",
	async ({ page }, placeholder: string) => {
		await expect(page.getByPlaceholder(placeholder)).toBeVisible();
	},
);

When(
	"I type {string} into the topic input",
	async ({ page }, topic: string) => {
		await page.getByRole("textbox").fill(topic);
	},
);

When("I leave the topic input empty", async ({ page }) => {
	await page.getByRole("textbox").clear();
});

Then(
	"I should see a validation message asking me to enter a topic",
	async ({ page }) => {
		await expect(page.getByText(/enter a topic/i)).toBeVisible();
	},
);

Then("I should remain on the topic input page", async ({ page }) => {
	await expect(page).toHaveURL("/");
});
